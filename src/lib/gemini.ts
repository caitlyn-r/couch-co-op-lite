import { WatchlistEntry, UserSettings, GeminiRecommendation, VibeRouletteResult, AudienceType, MediaType } from '../types';
import { searchTMDB, getPosterUrl } from './tmdb';
import { searchGamesRAWG } from './games';
import { searchBooksOpenLibrary, getBookCoverUrl } from './books';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function generateAIRecommendations(
  watchlist: WatchlistEntry[],
  settings: UserSettings,
  mode: 'compromise' | 'partner1_solo' | 'partner2_solo' = 'compromise',
  mediaCategory: 'all' | 'movies' | 'games' | 'books' = 'all',
  seenTitles: Set<string> = new Set()
): Promise<GeminiRecommendation[]> {
  const existingTitleSet = new Set<string>();
  watchlist.forEach((item) => existingTitleSet.add(item.title.trim().toLowerCase()));
  seenTitles.forEach((title) => existingTitleSet.add(title.trim().toLowerCase()));

  if (!settings.geminiApiKey) {
    return getFallbackRecommendations(settings, mode, mediaCategory, existingTitleSet);
  }

  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';

  const watchedItems = watchlist.filter((item) => item.status === 'watched');
  const backlogItems = watchlist.filter((item) => item.status === 'watchlist' || item.status === 'watching');

  const formatSummary = (items: WatchlistEntry[]) =>
    items
      .map((item) => {
        const r1 = item.partner1Rating ? `${p1}: ${item.partner1Rating}/10` : '';
        const r2 = item.partner2Rating ? `${p2}: ${item.partner2Rating}/10` : '';
        const ratings = [r1, r2].filter(Boolean).join(', ');
        const creatorInfo = item.creator ? ` by ${item.creator}` : '';
        return `- [${item.type.toUpperCase()}] "${item.title}"${creatorInfo} (${item.year}, [${item.genres.join(', ')}]) [Audience: ${item.audience}] ${ratings ? `{${ratings}}` : ''}`;
      })
      .join('\n');

  const watchedSummary = formatSummary(watchedItems);
  const backlogSummary = formatSummary(backlogItems);
  const allTitlesList = Array.from(existingTitleSet).map((t) => `"${t}"`).join(', ');

  let modeInstruction = '';
  let targetAudience: AudienceType = 'together';

  if (mode === 'compromise') {
    modeInstruction = `Recommend 5 NEW titles that find the sweet spot / middle ground for BOTH ${p1} and ${p2} to enjoy TOGETHER. Even if their solo tastes differ (e.g. one likes romance and the other likes sci-fi), find clever crossover titles that bridge both tastes.`;
    targetAudience = 'together';
  } else if (mode === 'partner1_solo') {
    modeInstruction = `Recommend 5 NEW titles strictly tailored to ${p1}'s personal solo taste and high ratings. Do NOT worry about ${p2}'s preferences.`;
    targetAudience = 'partner1';
  } else {
    modeInstruction = `Recommend 5 NEW titles strictly tailored to ${p2}'s personal solo taste and high ratings. Do NOT worry about ${p1}'s preferences.`;
    targetAudience = 'partner2';
  }

  let mediaInstruction = 'You can recommend Movies, TV Series, Video Games, or Books depending on what fits best.';
  if (mediaCategory === 'movies') mediaInstruction = 'Recommend ONLY Movies or TV Series.';
  if (mediaCategory === 'games') mediaInstruction = 'Recommend ONLY Video Games (indicate if co-op or solo, platform suggestions).';
  if (mediaCategory === 'books') mediaInstruction = 'Recommend ONLY Books / Audiobooks (include the author).';

  const prompt = `You are an entertainment critic and media matchmaker for "${p1}" and "${p2}".

Here is their COMPLETED / WATCHED / PLAYED history (use this strictly to understand their taste and ratings):
${watchedSummary || 'No completed items yet.'}

Here is their CURRENT PENDING BACKLOG (titles they already have queued up):
${backlogSummary || 'No backlog items yet.'}

CRITICAL EXCLUSION LIST (NEVER RECOMMEND ANY OF THESE TITLES):
${allTitlesList || 'None.'}

Goal:
${modeInstruction}
${mediaInstruction}

CRITICAL RULES:
1. Every recommendation MUST be a brand new, unadded title that neither partner has in their library or in the exclusion list.
2. DO NOT recommend any title that has already been watched, played, read, queued, or recently shown.
3. Provide fresh and surprising titles on every generation.

Return ONLY a valid JSON array of 5 objects matching this exact structure:
[
  {
    "title": "Title Name",
    "type": "movie" | "tv" | "game" | "book",
    "year": "2023",
    "creator": "Director / Studio / Author",
    "platforms": ["Switch", "PS5", "PC"], // (only if game)
    "genres": ["Sci-Fi", "Mystery"],
    "reason": "Personalized 1-2 sentence explanation of why this fits.",
    "matchScore": 95,
    "audience": "${targetAudience}"
  }
]`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) throw new Error(`Gemini status: ${res.status}`);

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No text received from Gemini');

    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed: GeminiRecommendation[] = JSON.parse(cleanJson);
    
    // Strict client-side filter: Ensure no recommendation matches any existing or recently seen title
    const unadded = parsed.filter((item) => !existingTitleSet.has(item.title.trim().toLowerCase()));

    // Enrich missing poster URLs using search APIs
    const enriched = await Promise.all(
      unadded.map(async (item) => {
        let poster = item.posterUrl;
        if (!poster) {
          try {
            if (item.type === 'movie' || item.type === 'tv') {
              const results = await searchTMDB(item.title, settings.tmdbApiKey);
              if (results[0]?.poster_path) {
                poster = getPosterUrl(results[0].poster_path, 'w500');
              }
            } else if (item.type === 'game') {
              const results = await searchGamesRAWG(item.title, settings.rawgApiKey);
              if (results[0]?.background_image) {
                poster = results[0].background_image;
              }
            } else if (item.type === 'book') {
              const results = await searchBooksOpenLibrary(item.title);
              if (results[0]?.posterUrl) {
                poster = results[0].posterUrl;
              } else if (results[0]?.cover_i) {
                poster = getBookCoverUrl(results[0].cover_i);
              }
            }
          } catch (e) {
            console.warn('Could not enrich poster for', item.title);
          }
        }
        return {
          ...item,
          posterUrl: poster || getPosterFallback(item.type),
          audience: targetAudience,
        };
      })
    );

    if (enriched.length > 0) {
      return enriched;
    }
    return getFallbackRecommendations(settings, mode, mediaCategory, existingTitleSet);
  } catch (err) {
    console.error('Failed to generate Gemini recommendations:', err);
    return getFallbackRecommendations(settings, mode, mediaCategory, existingTitleSet);
  }
}

function getPosterFallback(type: string): string {
  switch (type) {
    case 'game':
      return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
    case 'book':
      return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
  }
}

export async function pickMovieNightVibe(
  watchlist: WatchlistEntry[],
  vibePrompt: string,
  settings: UserSettings,
  mediaCategory: 'all' | 'movies' | 'games' | 'books' = 'all',
  seenTitles: Set<string> = new Set()
): Promise<VibeRouletteResult> {
  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';
  
  // Backlog items matching category, excluding already spun/seen titles in this session
  const candidateBacklog = watchlist.filter(
    (item) =>
      (item.status === 'watchlist' || item.status === 'watching') &&
      (mediaCategory === 'all' ||
        (mediaCategory === 'movies' && (item.type === 'movie' || item.type === 'tv')) ||
        (mediaCategory === 'games' && item.type === 'game') ||
        (mediaCategory === 'books' && item.type === 'book'))
  );

  const freshBacklog = candidateBacklog.filter((item) => !seenTitles.has(item.title.toLowerCase()));
  const activeWatchlist = freshBacklog.length > 0 ? freshBacklog : candidateBacklog;

  if (!settings.geminiApiKey) {
    if (activeWatchlist.length > 0) {
      const picked = activeWatchlist[Math.floor(Math.random() * activeWatchlist.length)];
      return {
        title: picked.title,
        type: picked.type,
        pitch: `Chosen from your backlog! A top-tier pick for "${vibePrompt}". It has great pacing, memorable moments, and fits your current mood perfectly.`,
        vibe: vibePrompt,
        matchedFromWatchlist: true,
        posterUrl: picked.posterUrl,
        year: picked.year,
        creator: picked.creator,
        genres: picked.genres,
        platforms: picked.platforms,
        audience: picked.audience,
        runtime: picked.type === 'movie' ? '1h 55m' : picked.type === 'book' ? '380 pages' : '15 hours',
      };
    }

    // Curated fallback roulette pool
    const ROULETTE_POOL: VibeRouletteResult[] = [
      {
        title: 'Palm Springs',
        type: 'movie',
        pitch: 'A hilarious, witty, and existential time-loop rom-com with incredible chemistry and great pacing.',
        vibe: vibePrompt,
        matchedFromWatchlist: false,
        posterUrl: 'https://image.tmdb.org/t/p/w500/1fgjgEPXz2zM2pP1oB1m1L0jV9D.jpg',
        year: '2020',
        genres: ['Comedy', 'Romance', 'Sci-Fi'],
        runtime: '1h 30m',
        audience: 'together',
      },
      {
        title: 'Knives Out',
        type: 'movie',
        pitch: 'A brilliantly crafted whodunit murder mystery with sharp wit, quirky characters, and cozy mansion vibes.',
        vibe: vibePrompt,
        matchedFromWatchlist: false,
        posterUrl: 'https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg',
        year: '2019',
        genres: ['Mystery', 'Comedy', 'Drama'],
        runtime: '2h 10m',
        audience: 'together',
      },
      {
        title: 'Overcooked! 2',
        type: 'game',
        pitch: 'The ultimate 2-player kitchen rush! Fast, chaotic, and filled with loud laughs and teamwork.',
        vibe: vibePrompt,
        matchedFromWatchlist: false,
        posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
        year: '2018',
        genres: ['Party', 'Co-op', 'Casual'],
        platforms: ['Switch', 'PS5', 'PC', 'Xbox'],
        runtime: '10-15 hours',
        audience: 'together',
      },
      {
        title: 'Portal 2',
        type: 'game',
        pitch: 'Mind-bending cooperative physics puzzles and top-tier comedy from GLaDOS for the perfect game night.',
        vibe: vibePrompt,
        matchedFromWatchlist: false,
        posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
        year: '2011',
        genres: ['Puzzle', 'Co-op', 'Sci-Fi'],
        platforms: ['Switch', 'PC', 'Xbox'],
        runtime: '8 hours',
        audience: 'together',
      },
      {
        title: 'Project Hail Mary',
        type: 'book',
        pitch: 'An unforgettable space survival adventure filled with scientific optimism, witty humor, and heartwarming friendship.',
        vibe: vibePrompt,
        matchedFromWatchlist: false,
        posterUrl: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
        year: '2021',
        creator: 'Andy Weir',
        genres: ['Sci-Fi', 'Adventure', 'Humor'],
        runtime: '496 pages',
        audience: 'together',
      },
      {
        title: 'The Song of Achilles',
        type: 'book',
        pitch: 'A lyrical, breathtaking reimagining of the Iliad with profound emotional depth and stunning prose.',
        vibe: vibePrompt,
        matchedFromWatchlist: false,
        posterUrl: 'https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg',
        year: '2011',
        creator: 'Madeline Miller',
        genres: ['Mythology', 'Historical Fiction', 'Romance'],
        runtime: '416 pages',
        audience: 'together',
      },
    ];

    const categoryFiltered = ROULETTE_POOL.filter(
      (item) =>
        mediaCategory === 'all' ||
        (mediaCategory === 'movies' && (item.type === 'movie' || item.type === 'tv')) ||
        (mediaCategory === 'games' && item.type === 'game') ||
        (mediaCategory === 'books' && item.type === 'book')
    );

    const unseen = categoryFiltered.filter((item) => !seenTitles.has(item.title.toLowerCase()));
    const finalPool = unseen.length > 0 ? unseen : categoryFiltered;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  const listTitles = activeWatchlist.map(
    (w) => `[${w.type.toUpperCase()}] "${w.title}" (${w.year}, [${w.genres.join(', ')}]) [Audience: ${w.audience}]`
  );

  const seenList = Array.from(seenTitles).map((s) => `"${s}"`).join(', ');

  const prompt = `You are a charismatic Media Night Host for ${p1} and ${p2}.
They want to pick something to watch, play, or read with this vibe: "${vibePrompt}".
Category constraint: ${mediaCategory.toUpperCase()}.

Here is their current pending list:
${listTitles.length > 0 ? listTitles.join('\n') : 'List is empty.'}

CRITICAL: DO NOT PICK OR SUGGEST ANY OF THESE PREVIOUSLY SHOWN TITLES:
${seenList || 'None.'}

Task:
1. If there's a strong fit on their list, prioritize picking it!
2. Otherwise, suggest a fantastic new title that fits the vibe.
3. Write an exciting 2-sentence pitch for why this is the winning choice.

Return ONLY a valid JSON object matching:
{
  "title": "Title Name",
  "type": "movie" | "tv" | "game" | "book",
  "creator": "Author / Studio / Director",
  "pitch": "Punchy 2-sentence pitch for tonight.",
  "vibe": "${vibePrompt}",
  "matchedFromWatchlist": true | false,
  "year": "2023",
  "genres": ["Comedy", "Sci-Fi"],
  "runtime": "1h 45m" | "350 pages" | "12 hours",
  "audience": "together"
}`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) throw new Error(`Gemini status: ${res.status}`);
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const localMatch = watchlist.find((w) => w.title.toLowerCase() === parsed.title.toLowerCase());
    if (localMatch) {
      parsed.posterUrl = localMatch.posterUrl;
      parsed.creator = localMatch.creator || parsed.creator;
      parsed.platforms = localMatch.platforms;
    }

    return parsed;
  } catch (err) {
    console.error('Gemini Vibe Decider error:', err);
    return {
      title: activeWatchlist[0]?.title || 'Arrival',
      type: (activeWatchlist[0]?.type || 'movie') as any,
      pitch: `A breathtaking pick for "${vibePrompt}". Gripping atmosphere, brilliant writing, and unforgettable moments!`,
      vibe: vibePrompt,
      matchedFromWatchlist: Boolean(activeWatchlist[0]),
      posterUrl: activeWatchlist[0]?.posterUrl || 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
      year: activeWatchlist[0]?.year || '2016',
      genres: activeWatchlist[0]?.genres || ['Sci-Fi', 'Drama'],
      runtime: '1h 56m',
      audience: activeWatchlist[0]?.audience || 'together',
    };
  }
}

function getFallbackRecommendations(
  settings: UserSettings,
  mode: 'compromise' | 'partner1_solo' | 'partner2_solo',
  mediaCategory: 'all' | 'movies' | 'games' | 'books',
  existingTitles: Set<string> = new Set()
): GeminiRecommendation[] {
  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';

  // 1. Rich 10+ items library per category per mode
  const DATABASE: Record<
    'compromise' | 'partner1_solo' | 'partner2_solo',
    { movies: GeminiRecommendation[]; games: GeminiRecommendation[]; books: GeminiRecommendation[] }
  > = {
    compromise: {
      movies: [
        {
          title: 'About Time',
          type: 'movie',
          year: '2013',
          genres: ['Romance', 'Comedy', 'Sci-Fi'],
          reason: `The ultimate compromise: combines heartwarming romantic charm for ${p1} with a clever time-travel premise that ${p2} will respect.`,
          matchScore: 98,
          posterUrl: 'https://image.tmdb.org/t/p/w500/i8MQC6hQ5Yl3l43s2N9y5vQ7k6.jpg',
          audience: 'together',
        },
        {
          title: 'Palm Springs',
          type: 'movie',
          year: '2020',
          genres: ['Comedy', 'Romance', 'Sci-Fi'],
          reason: `Smart existential time-loop comedy that blends laugh-out-loud wedding banter with great high-concept sci-fi.`,
          matchScore: 95,
          posterUrl: 'https://image.tmdb.org/t/p/w500/1fgjgEPXz2zM2pP1oB1m1L0jV9D.jpg',
          audience: 'together',
        },
        {
          title: 'Everything Everywhere All at Once',
          type: 'movie',
          year: '2022',
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          reason: `A wildly creative multiverse rollercoaster with heartfelt family drama, visual spectacle, and unforgettable humor.`,
          matchScore: 97,
          posterUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYilua0gIgIo9a3YneT37s.jpg',
          audience: 'together',
        },
        {
          title: 'Knives Out',
          type: 'movie',
          year: '2019',
          genres: ['Mystery', 'Comedy', 'Drama'],
          reason: `A delightfully witty whodunit with an all-star ensemble, brilliant pacing, and fun twists to solve together.`,
          matchScore: 94,
          posterUrl: 'https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg',
          audience: 'together',
        },
        {
          title: 'Ted Lasso',
          type: 'tv',
          year: '2020',
          genres: ['Comedy', 'Drama', 'Sports'],
          reason: `Infectiously wholesome humor, sharp British banter, and great character development both partners will binge.`,
          matchScore: 96,
          posterUrl: 'https://image.tmdb.org/t/p/w500/5MfAyyT5L16q410z11z3p803f2e.jpg',
          audience: 'together',
        },
        {
          title: 'Stranger Things',
          type: 'tv',
          year: '2016',
          genres: ['Sci-Fi', 'Drama', 'Mystery'],
          reason: `Gripping supernatural mystery and nostalgic 80s vibes that will keep you on the edge of your seat together.`,
          matchScore: 96,
          posterUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
          audience: 'together',
        },
        {
          title: 'Spider-Man: Into the Spider-Verse',
          type: 'movie',
          year: '2018',
          genres: ['Animation', 'Action', 'Adventure'],
          reason: `Groundbreaking comic-book visual style, incredible music, and a touching coming-of-age story for duo movie night.`,
          matchScore: 97,
          posterUrl: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
          audience: 'together',
        },
        {
          title: 'The Good Place',
          type: 'tv',
          year: '2016',
          genres: ['Comedy', 'Fantasy', 'Philosophical'],
          reason: `Fast-paced philosophical comedy packed with shocking plot twists, high concept worldbuilding, and massive laughs.`,
          matchScore: 95,
          posterUrl: 'https://image.tmdb.org/t/p/w500/dZ06F1o2G2lXvE546Jb47e2s3k.jpg',
          audience: 'together',
        },
      ],
      games: [
        {
          title: 'Overcooked! 2',
          type: 'game',
          year: '2018',
          genres: ['Party', 'Co-op', 'Casual'],
          platforms: ['Switch', 'PS5', 'PC', 'Xbox'],
          reason: `Pure co-op teamwork and chaotic laughter that brings both ${p1} and ${p2} together for 2-player game night.`,
          matchScore: 96,
          posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
        {
          title: 'Unravel Two',
          type: 'game',
          year: '2018',
          genres: ['Platformer', 'Co-op', 'Puzzle'],
          platforms: ['Switch', 'PS5', 'PC', 'Xbox'],
          reason: `A visually stunning 2-player cooperative puzzle platformer centered on teamwork, physics, and companionship.`,
          matchScore: 94,
          posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
        {
          title: 'Portal 2',
          type: 'game',
          year: '2011',
          genres: ['Puzzle', 'Co-op', 'Sci-Fi'],
          platforms: ['Switch', 'PC', 'Xbox'],
          reason: `Legendary 2-player cooperative test chambers packed with hilarious robotic humor and mind-bending physics puzzles.`,
          matchScore: 97,
          posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
        {
          title: 'A Way Out',
          type: 'game',
          year: '2018',
          genres: ['Action', 'Co-op', 'Cinematic'],
          platforms: ['PS5', 'PC', 'Xbox'],
          reason: `Split-screen prison break adventure designed exclusively for two players with intense cinematic decision-making.`,
          matchScore: 93,
          posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
        {
          title: 'Chained Together',
          type: 'game',
          year: '2024',
          genres: ['Co-op', 'Physics', 'Indie'],
          platforms: ['PC'],
          reason: `Hilariously high-stakes 2-player platforming where you are literally chained together escaping the depths of the underworld.`,
          matchScore: 92,
          posterUrl: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
        {
          title: 'It Takes Two',
          type: 'game',
          year: '2021',
          genres: ['Adventure', 'Co-op', 'Platformer'],
          platforms: ['PS5', 'Switch', 'PC', 'Xbox'],
          reason: `Genre-bending co-op masterpiece crafted purely for two players with constantly shifting innovative mechanics.`,
          matchScore: 99,
          posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
        {
          title: 'Untitled Goose Game',
          type: 'game',
          year: '2019',
          genres: ['Comedy', 'Stealth', 'Co-op'],
          platforms: ['Switch', 'PC', 'PS4'],
          reason: `Hilarious 2-player mischief where two terrible geese wreak havoc on an unsuspecting English village.`,
          matchScore: 95,
          posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          audience: 'together',
        },
      ],
      books: [
        {
          title: 'The Midnight Library',
          type: 'book',
          year: '2020',
          creator: 'Matt Haig',
          genres: ['Fiction', 'Fantasy', 'Philosophical'],
          reason: `A wonderful shared book club read: explores infinite alternate lives and heartwarming life perspective that both partners will love discussing.`,
          matchScore: 95,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg',
          audience: 'together',
        },
        {
          title: 'Project Hail Mary',
          type: 'book',
          year: '2021',
          creator: 'Andy Weir',
          genres: ['Sci-Fi', 'Adventure', 'Humor'],
          reason: `An uplifting, witty space survival story filled with friendship and scientific optimism that makes for an incredible duo read.`,
          matchScore: 96,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
          audience: 'together',
        },
        {
          title: 'The Seven Husbands of Evelyn Hugo',
          type: 'book',
          year: '2017',
          creator: 'Taylor Jenkins Reid',
          genres: ['Historical Fiction', 'Drama', 'Romance'],
          reason: `Old Hollywood glamour, secret romances, and captivating storytelling that hooks readers from page one.`,
          matchScore: 94,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg',
          audience: 'together',
        },
        {
          title: 'Dark Matter',
          type: 'book',
          year: '2016',
          creator: 'Blake Crouch',
          genres: ['Sci-Fi', 'Thriller', 'Parallel Worlds'],
          reason: `Fast-paced parallel universe thriller exploring love, choices, and destiny that is impossible to put down.`,
          matchScore: 93,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781101904220-L.jpg',
          audience: 'together',
        },
        {
          title: 'The Song of Achilles',
          type: 'book',
          year: '2011',
          creator: 'Madeline Miller',
          genres: ['Mythology', 'Historical Fiction', 'Romance'],
          reason: `A gorgeous, lyrical reimagining of the Iliad with deep emotional resonance and breathtaking prose.`,
          matchScore: 95,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg',
          audience: 'together',
        },
        {
          title: 'Tomorrow, and Tomorrow, and Tomorrow',
          type: 'book',
          year: '2022',
          creator: 'Gabrielle Zevin',
          genres: ['Fiction', 'Video Games', 'Friendship'],
          reason: `A brilliant story of creative partnership, shared gaming worlds, and lifelong bonds across thirty years.`,
          matchScore: 97,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg',
          audience: 'together',
        },
        {
          title: 'Piranesi',
          type: 'book',
          year: '2020',
          creator: 'Susanna Clarke',
          genres: ['Fantasy', 'Mystery', 'Atmospheric'],
          reason: `Short, enchanting, and deeply atmospheric mystery set inside an infinite house of ocean tides and marble statues.`,
          matchScore: 94,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781635575637-L.jpg',
          audience: 'together',
        },
      ],
    },
    partner1_solo: {
      movies: [
        {
          title: 'Queen Charlotte: A Bridgerton Story',
          type: 'tv',
          year: '2023',
          genres: ['Drama', 'Romance', 'Historical'],
          reason: `Tailored specifically for ${p1}'s love of period romance, sumptuous ballgowns, and witty high-society banter.`,
          matchScore: 99,
          posterUrl: 'https://image.tmdb.org/t/p/w500/989iXhK5x2zB7y50nI3v6Ew8N6c.jpg',
          audience: 'partner1',
        },
        {
          title: 'Pride and Prejudice',
          type: 'movie',
          year: '2005',
          genres: ['Romance', 'Drama', 'Period'],
          reason: `The gold standard of Regency romance with iconic cinematography, unforgettable tension, and comforting charm.`,
          matchScore: 98,
          posterUrl: 'https://image.tmdb.org/t/p/w500/sGjIvtIEv0Bwt84teI1s9G2ZJz8.jpg',
          audience: 'partner1',
        },
        {
          title: 'Normal People',
          type: 'tv',
          year: '2020',
          genres: ['Drama', 'Romance'],
          reason: `Intimate, emotionally raw character study of modern romance with stunning Irish landscapes.`,
          matchScore: 95,
          posterUrl: 'https://image.tmdb.org/t/p/w500/5mG1n10G078Y2a0f7z22m8s9f1p.jpg',
          audience: 'partner1',
        },
        {
          title: 'La La Land',
          type: 'movie',
          year: '2016',
          genres: ['Musical', 'Romance', 'Drama'],
          reason: `A vibrant, romantic musical ode to dreamers filled with unforgettable jazz melodies and dazzling colors.`,
          matchScore: 96,
          posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg',
          audience: 'partner1',
        },
        {
          title: 'Gilmore Girls',
          type: 'tv',
          year: '2000',
          genres: ['Comedy', 'Drama', 'Family'],
          reason: `The ultimate cozy comfort watch: autumn vibes, rapid-fire witty dialogue, and charming small-town warmth.`,
          matchScore: 97,
          posterUrl: 'https://image.tmdb.org/t/p/w500/5x0p2o3P4b7lQ5Y1a8m9f1k6z2.jpg',
          audience: 'partner1',
        },
        {
          title: 'Little Women',
          type: 'movie',
          year: '2019',
          genres: ['Drama', 'Romance', 'Period'],
          reason: `Greta Gerwig’s joyful, heartwarming adaptation bursting with sisterly love, passion, and gorgeous cinematography.`,
          matchScore: 98,
          posterUrl: 'https://image.tmdb.org/t/p/w500/yn5ih0VhZ95AMP3RqUt0VO5NBNC.jpg',
          audience: 'partner1',
        },
        {
          title: 'The Marvelous Mrs. Maisel',
          type: 'tv',
          year: '2017',
          genres: ['Comedy', 'Drama', 'Period'],
          reason: `Incredible 1950s New York fashion, fast and hilarious comedy routines, and dazzling charm.`,
          matchScore: 96,
          posterUrl: 'https://image.tmdb.org/t/p/w500/y1Z3lR5qX8w0zK4e7j2m9f1p4x8.jpg',
          audience: 'partner1',
        },
      ],
      games: [
        {
          title: 'Stardew Valley',
          type: 'game',
          year: '2016',
          genres: ['Life Sim', 'Cozy', 'Farming'],
          platforms: ['Switch', 'PC', 'PlayStation'],
          reason: `A relaxing, heartwarming solo farming adventure to unwind with a cup of tea.`,
          matchScore: 97,
          posterUrl: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&auto=format&fit=crop&q=80',
          audience: 'partner1',
        },
        {
          title: 'Animal Crossing: New Horizons',
          type: 'game',
          year: '2020',
          genres: ['Life Sim', 'Casual', 'Cozy'],
          platforms: ['Nintendo Switch'],
          reason: `Create your dream island paradise at your own pace with lovable animal villagers and endless decorating.`,
          matchScore: 96,
          posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          audience: 'partner1',
        },
        {
          title: 'Unpacking',
          type: 'game',
          year: '2021',
          genres: ['Puzzle', 'Cozy', 'Narrative'],
          platforms: ['Switch', 'PC', 'PlayStation'],
          reason: `Zen, satisfying puzzle gameplay about unpacking boxes and discovering a character's life story through their belongings.`,
          matchScore: 95,
          posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
          audience: 'partner1',
        },
        {
          title: 'Disney Dreamlight Valley',
          type: 'game',
          year: '2023',
          genres: ['Life Sim', 'Adventure', 'Casual'],
          platforms: ['Switch', 'PC', 'PS5'],
          reason: `Magical life sim where you restore a fantasy valley alongside beloved Disney and Pixar characters.`,
          matchScore: 93,
          posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
          audience: 'partner1',
        },
        {
          title: 'Cozy Grove',
          type: 'game',
          year: '2021',
          genres: ['Life Sim', 'Cozy', 'Hand-drawn'],
          platforms: ['Switch', 'PC', 'PlayStation'],
          reason: `Camping on a haunted island with hand-drawn art, heartwarming ghost stories, and daily relaxing tasks.`,
          matchScore: 92,
          posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
          audience: 'partner1',
        },
        {
          title: 'Dave the Diver',
          type: 'game',
          year: '2023',
          genres: ['Adventure', 'Casual', 'Management'],
          platforms: ['Switch', 'PC', 'PS5'],
          reason: `Charming daytime ocean exploration paired with running a cozy sushi restaurant at night.`,
          matchScore: 96,
          posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          audience: 'partner1',
        },
      ],
      books: [
        {
          title: 'A Court of Thorns and Roses',
          type: 'book',
          year: '2015',
          creator: 'Sarah J. Maas',
          genres: ['Fantasy', 'Romance', 'Fae'],
          reason: `A beloved romantic fantasy page-turner with high stakes and deep emotional immersion just for ${p1}.`,
          matchScore: 98,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781619634442-L.jpg',
          audience: 'partner1',
        },
        {
          title: 'Fourth Wing',
          type: 'book',
          year: '2023',
          creator: 'Rebecca Yarros',
          genres: ['Fantasy', 'Dragons', 'Romance'],
          reason: `Epic dragon rider fantasy academy with intense chemistry and gripping suspense for ${p1}.`,
          matchScore: 96,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781649374042-L.jpg',
          audience: 'partner1',
        },
        {
          title: 'Book Lovers',
          type: 'book',
          year: '2022',
          creator: 'Emily Henry',
          genres: ['Romance', 'Contemporary', 'Humor'],
          reason: `Witty enemies-to-lovers rom-com exploring sisterhood and book publishing with sharp, hilarious dialogue.`,
          matchScore: 95,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780593334836-L.jpg',
          audience: 'partner1',
        },
        {
          title: 'Divine Rivals',
          type: 'book',
          year: '2023',
          creator: 'Rebecca Ross',
          genres: ['Fantasy', 'Romance', 'Historical'],
          reason: `Enchanting rivals-to-lovers historical fantasy centered around magical typewriters in the midst of a war between gods.`,
          matchScore: 94,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781250857439-L.jpg',
          audience: 'partner1',
        },
        {
          title: 'Red, White & Royal Blue',
          type: 'book',
          year: '2019',
          creator: 'Casey McQuiston',
          genres: ['Romance', 'Contemporary', 'LGBTQ+'],
          reason: `Heartwarming, funny, and optimistic romantic comedy between the First Son of the US and the Prince of Wales.`,
          matchScore: 93,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9781250316776-L.jpg',
          audience: 'partner1',
        },
        {
          title: 'Happy Place',
          type: 'book',
          year: '2023',
          creator: 'Emily Henry',
          genres: ['Romance', 'Contemporary', 'Friendship'],
          reason: `A touching fake-dating romance among long-time best friends at a coastal cottage in Maine.`,
          matchScore: 95,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780593441275-L.jpg',
          audience: 'partner1',
        },
      ],
    },
    partner2_solo: {
      movies: [
        {
          title: 'Dark',
          type: 'tv',
          year: '2017',
          genres: ['Sci-Fi', 'Mystery', 'Thriller'],
          reason: `Complex time-travel puzzle box narrative with dark atmosphere and mind-bending lore designed for ${p2}.`,
          matchScore: 99,
          posterUrl: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
          audience: 'partner2',
        },
        {
          title: 'Blade Runner 2049',
          type: 'movie',
          year: '2017',
          genres: ['Sci-Fi', 'Mystery', 'Neo-Noir'],
          reason: `Visually stunning sci-fi masterpiece with rich cyberpunk worldbuilding and philosophical depth for ${p2}.`,
          matchScore: 97,
          posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
          audience: 'partner2',
        },
        {
          title: 'Interstellar',
          type: 'movie',
          year: '2014',
          genres: ['Sci-Fi', 'Drama', 'Adventure'],
          reason: `Epic space exploration saga featuring black holes, gravitational anomalies, and a stunning Hans Zimmer score.`,
          matchScore: 98,
          posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          audience: 'partner2',
        },
        {
          title: 'The Last of Us',
          type: 'tv',
          year: '2023',
          genres: ['Drama', 'Sci-Fi', 'Post-Apocalyptic'],
          reason: `Grounded post-apocalyptic thriller with phenomenal storytelling, emotional stakes, and survival grit.`,
          matchScore: 96,
          posterUrl: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7JMrne.jpg',
          audience: 'partner2',
        },
        {
          title: 'True Detective',
          type: 'tv',
          year: '2014',
          genres: ['Crime', 'Drama', 'Mystery'],
          reason: `Gripping Southern gothic noir investigation with philosophical dialogue and unforgettable atmosphere.`,
          matchScore: 95,
          posterUrl: 'https://image.tmdb.org/t/p/w500/cuV2O53rDH83phomM7Bm9390v1p.jpg',
          audience: 'partner2',
        },
        {
          title: 'Dune: Part Two',
          type: 'movie',
          year: '2024',
          genres: ['Sci-Fi', 'Adventure', 'Action'],
          reason: `Monumental space epic with earth-shattering sound design, desert warfare, and prophetic political drama.`,
          matchScore: 99,
          posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
          audience: 'partner2',
        },
        {
          title: 'Arcane',
          type: 'tv',
          year: '2021',
          genres: ['Animation', 'Sci-Fi', 'Action'],
          reason: `Stunning steampunk animation, heartbreaking sisterly conflict, and elite action choreography.`,
          matchScore: 98,
          posterUrl: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397rWWcfGg9.jpg',
          audience: 'partner2',
        },
      ],
      games: [
        {
          title: 'Hades II',
          type: 'game',
          year: '2024',
          creator: 'Supergiant Games',
          genres: ['Roguelike', 'Action', 'Mythology'],
          platforms: ['PC', 'Steam'],
          reason: `Fast-paced rogue-like combat, greek mythology, and god-tier soundtrack tailored for ${p2}'s solo gaming sessions.`,
          matchScore: 98,
          posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
          audience: 'partner2',
        },
        {
          title: 'Cyberpunk 2077: Phantom Liberty',
          type: 'game',
          year: '2023',
          genres: ['RPG', 'Sci-Fi', 'Open World'],
          platforms: ['PS5', 'PC', 'Xbox'],
          reason: `Immersive dystopian spy-thriller RPG set in Night City with incredible visual fidelity and branching storylines.`,
          matchScore: 97,
          posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
          audience: 'partner2',
        },
        {
          title: 'Baldur’s Gate 3',
          type: 'game',
          year: '2023',
          genres: ['RPG', 'Strategy', 'Fantasy'],
          platforms: ['PS5', 'PC', 'Xbox'],
          reason: `Masterpiece D&D tactical RPG with unrivaled freedom of choice, rich companions, and epic tactical combat.`,
          matchScore: 99,
          posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
          audience: 'partner2',
        },
        {
          title: 'Ghost of Tsushima',
          type: 'game',
          year: '2020',
          genres: ['Action', 'Open World', 'Samurai'],
          platforms: ['PS5', 'PC'],
          reason: `Breathtaking open-world samurai epic inspired by classic cinema, precise swordplay, and dramatic story.`,
          matchScore: 96,
          posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          audience: 'partner2',
        },
        {
          title: 'God of War Ragnarök',
          type: 'game',
          year: '2022',
          genres: ['Action', 'Mythology', 'Adventure'],
          platforms: ['PS5', 'PS4'],
          reason: `Cinematic Norse mythology epic featuring visceral combat and a powerful father-son narrative.`,
          matchScore: 95,
          posterUrl: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?w=600&auto=format&fit=crop&q=80',
          audience: 'partner2',
        },
        {
          title: 'Elden Ring',
          type: 'game',
          year: '2022',
          genres: ['Action RPG', 'Open World', 'Dark Fantasy'],
          platforms: ['PS5', 'PC', 'Xbox'],
          reason: `Unmatched sense of discovery, epic boss battles, and dark atmospheric world design in the Lands Between.`,
          matchScore: 99,
          posterUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
          audience: 'partner2',
        },
      ],
      books: [
        {
          title: 'Dune: Messiah',
          type: 'book',
          year: '1969',
          creator: 'Frank Herbert',
          genres: ['Science Fiction', 'Political Intrigue'],
          reason: `Continues the grand philosophical and political space opera saga that ${p2} loves.`,
          matchScore: 96,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780441172696-L.jpg',
          audience: 'partner2',
        },
        {
          title: 'The Three-Body Problem',
          type: 'book',
          year: '2008',
          creator: 'Cixin Liu',
          genres: ['Hard Sci-Fi', 'Mystery', 'Physics'],
          reason: `Mind-bending cosmic sci-fi tackling first contact, game theory, and civilization survival on a galactic scale.`,
          matchScore: 97,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780765377067-L.jpg',
          audience: 'partner2',
        },
        {
          title: 'Hyperion',
          type: 'book',
          year: '1989',
          creator: 'Dan Simmons',
          genres: ['Sci-Fi', 'Space Opera', 'Mystery'],
          reason: `Canterbury Tales-inspired sci-fi epic following seven pilgrims journeying to the enigmatic Shrike creature.`,
          matchScore: 95,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780553283686-L.jpg',
          audience: 'partner2',
        },
        {
          title: 'Neuromancer',
          type: 'book',
          year: '1984',
          creator: 'William Gibson',
          genres: ['Cyberpunk', 'Sci-Fi', 'Classic'],
          reason: `The seminal cyberpunk novel that coined the term cyberspace: hacking, AI, and gritty retro-futurism.`,
          matchScore: 94,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg',
          audience: 'partner2',
        },
        {
          title: 'Leviathan Wakes',
          type: 'book',
          year: '2011',
          creator: 'James S.A. Corey',
          genres: ['Space Opera', 'Mystery', 'Sci-Fi'],
          reason: `Grounded solar-system political thriller and detective noir that kicked off The Expanse series.`,
          matchScore: 96,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780316129084-L.jpg',
          audience: 'partner2',
        },
        {
          title: 'Children of Time',
          type: 'book',
          year: '2015',
          creator: 'Adrian Tchaikovsky',
          genres: ['Hard Sci-Fi', 'Evolution', 'Space Opera'],
          reason: `Brilliant, award-winning epic tracking the clash between humanity’s survivors and an uplifted spider civilization.`,
          matchScore: 97,
          posterUrl: 'https://covers.openlibrary.org/b/isbn/9780316452502-L.jpg',
          audience: 'partner2',
        },
      ],
    },
  };

  const modeData = DATABASE[mode];

  let rawList: GeminiRecommendation[] = [];

  if (mediaCategory === 'movies') {
    rawList = [...modeData.movies];
  } else if (mediaCategory === 'games') {
    rawList = [...modeData.games];
  } else if (mediaCategory === 'books') {
    rawList = [...modeData.books];
  } else {
    // "all": Blend of movies, games, and books
    rawList = [
      ...modeData.movies,
      ...modeData.games,
      ...modeData.books,
    ];
  }

  // Filter out any titles in the user's library or previously shown in this session
  const unseen = rawList.filter((item) => !existingTitles.has(item.title.trim().toLowerCase()));

  // If there are enough unseen items, return the top 5
  if (unseen.length >= 5) {
    return unseen.slice(0, 5);
  }

  // If not enough unseen items remain, wrap around and pull available ones
  const available = [...unseen];
  for (const item of rawList) {
    if (available.length >= 5) break;
    if (!available.some((a) => a.title.toLowerCase() === item.title.toLowerCase())) {
      available.push(item);
    }
  }

  return available.slice(0, 5);
}
