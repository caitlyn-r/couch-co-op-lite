import { WatchlistEntry, UserSettings, GeminiRecommendation, VibeRouletteResult, AudienceType, MediaType } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function generateAIRecommendations(
  watchlist: WatchlistEntry[],
  settings: UserSettings,
  mode: 'compromise' | 'partner1_solo' | 'partner2_solo' = 'compromise',
  mediaCategory: 'all' | 'movies' | 'games' | 'books' = 'all'
): Promise<GeminiRecommendation[]> {
  if (!settings.geminiApiKey) {
    return getFallbackRecommendations(settings, mode, mediaCategory);
  }

  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';

  // Filter and format history
  const historySummary = watchlist
    .map((item) => {
      const r1 = item.partner1Rating ? `${p1}: ${item.partner1Rating}/10` : '';
      const r2 = item.partner2Rating ? `${p2}: ${item.partner2Rating}/10` : '';
      const ratings = [r1, r2].filter(Boolean).join(', ');
      const creatorInfo = item.creator ? ` by ${item.creator}` : '';
      return `- [${item.type.toUpperCase()}] "${item.title}"${creatorInfo} (${item.year}, [${item.genres.join(', ')}]) [Audience: ${item.audience}] ${ratings ? `{${ratings}}` : ''}`;
    })
    .join('\n');

  let modeInstruction = '';
  let targetAudience: AudienceType = 'together';

  if (mode === 'compromise') {
    modeInstruction = `Recommend 5 titles that find the sweet spot / middle ground for BOTH ${p1} and ${p2} to enjoy TOGETHER. Even if their solo tastes differ (e.g. one likes romance and the other likes sci-fi), find clever crossover titles that satisfy both tastes.`;
    targetAudience = 'together';
  } else if (mode === 'partner1_solo') {
    modeInstruction = `Recommend 5 titles strictly tailored to ${p1}'s personal solo taste and high ratings. Do NOT worry about ${p2}'s preferences.`;
    targetAudience = 'partner1';
  } else {
    modeInstruction = `Recommend 5 titles strictly tailored to ${p2}'s personal solo taste and high ratings. Do NOT worry about ${p1}'s preferences.`;
    targetAudience = 'partner2';
  }

  let mediaInstruction = 'You can recommend Movies, TV Series, Video Games, or Books depending on what fits best.';
  if (mediaCategory === 'movies') mediaInstruction = 'Recommend ONLY Movies or TV Series.';
  if (mediaCategory === 'games') mediaInstruction = 'Recommend ONLY Video Games (indicate if co-op or solo, platform suggestions).';
  if (mediaCategory === 'books') mediaInstruction = 'Recommend ONLY Books / Audiobooks (include the author).';

  const prompt = `You are an entertainment critic and media matchmaker for "${p1}" and "${p2}".
Here is their shared viewing, gaming, and reading history and ratings:
${historySummary}

Goal:
${modeInstruction}
${mediaInstruction}

Do NOT recommend titles that are already in their history.

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
          temperature: 0.7,
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
    return parsed.map((item) => ({ ...item, audience: targetAudience }));
  } catch (err) {
    console.error('Failed to generate Gemini recommendations:', err);
    return getFallbackRecommendations(settings, mode, mediaCategory);
  }
}

export async function pickMovieNightVibe(
  watchlist: WatchlistEntry[],
  vibePrompt: string,
  settings: UserSettings,
  mediaCategory: 'all' | 'movies' | 'games' | 'books' = 'all'
): Promise<VibeRouletteResult> {
  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';
  const activeWatchlist = watchlist.filter(
    (item) =>
      (item.status === 'watchlist' || item.status === 'watching') &&
      (mediaCategory === 'all' ||
        (mediaCategory === 'movies' && (item.type === 'movie' || item.type === 'tv')) ||
        (mediaCategory === 'games' && item.type === 'game') ||
        (mediaCategory === 'books' && item.type === 'book'))
  );

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

    return {
      title: mediaCategory === 'games' ? 'Overcooked! 2' : mediaCategory === 'books' ? 'Dark Matter' : 'Palm Springs',
      type: mediaCategory === 'games' ? 'game' : mediaCategory === 'books' ? 'book' : 'movie',
      pitch: 'A hilarious, witty, and chaotic delight that guarantees instant entertainment and fun debates.',
      vibe: vibePrompt,
      matchedFromWatchlist: false,
      posterUrl: mediaCategory === 'games'
        ? 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600'
        : mediaCategory === 'books'
        ? 'https://covers.openlibrary.org/b/id/8326084-L.jpg'
        : 'https://image.tmdb.org/t/p/w500/1fgjgEPXz2zM2pP1oB1m1L0jV9D.jpg',
      year: '2020',
      creator: mediaCategory === 'books' ? 'Blake Crouch' : undefined,
      genres: ['Comedy', 'Mystery', 'Sci-Fi'],
      runtime: mediaCategory === 'books' ? '352 pages' : '1h 30m',
      audience: 'together',
    };
  }

  const listTitles = activeWatchlist.map(
    (w) => `[${w.type.toUpperCase()}] "${w.title}" (${w.year}, [${w.genres.join(', ')}]) [Audience: ${w.audience}]`
  );

  const prompt = `You are a charismatic Media Night Host for ${p1} and ${p2}.
They want to pick something to watch, play, or read with this vibe: "${vibePrompt}".
Category constraint: ${mediaCategory.toUpperCase()}.

Here is their current pending list:
${listTitles.length > 0 ? listTitles.join('\n') : 'List is empty.'}

Task:
1. If there's a strong fit on their list, prioritize picking it!
2. Otherwise, suggest a fantastic new title.
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
        generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
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
  mediaCategory: 'all' | 'movies' | 'games' | 'books'
): GeminiRecommendation[] {
  const p1 = settings.partner1Name || 'Partner 1';
  const p2 = settings.partner2Name || 'Partner 2';

  if (mode === 'partner1_solo') {
    return [
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
        title: 'A Court of Thorns and Roses',
        type: 'book',
        year: '2015',
        creator: 'Sarah J. Maas',
        genres: ['Fantasy', 'Romance', 'Fae'],
        reason: `A beloved romantic fantasy page-turner with high stakes and deep emotional immersion just for ${p1}.`,
        matchScore: 96,
        posterUrl: 'https://covers.openlibrary.org/b/id/12513470-L.jpg',
        audience: 'partner1',
      },
      {
        title: 'Stardew Valley',
        type: 'game',
        year: '2016',
        genres: ['Life Sim', 'Cozy', 'Farming'],
        platforms: ['Switch', 'PC', 'PlayStation'],
        reason: `A relaxing, heartwarming solo farming adventure to unwind with a cup of tea.`,
        matchScore: 94,
        posterUrl: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600',
        audience: 'partner1',
      },
    ];
  }

  if (mode === 'partner2_solo') {
    return [
      {
        title: 'Dark',
        type: 'tv',
        year: '2017',
        genres: ['Sci-Fi', 'Mystery', 'Thriller'],
        reason: `Complex time-travel puzzle box narrative with dark atmosphere and mind-bending lore designed for ${p2}.`,
        matchScore: 98,
        posterUrl: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
        audience: 'partner2',
      },
      {
        title: 'Hades II',
        type: 'game',
        year: '2024',
        creator: 'Supergiant Games',
        genres: ['Roguelike', 'Action', 'Mythology'],
        platforms: ['PC', 'Steam'],
        reason: `Fast-paced rogue-like combat, greek mythology, and god-tier soundtrack tailored for ${p2}'s solo gaming sessions.`,
        matchScore: 97,
        posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
        audience: 'partner2',
      },
      {
        title: 'Dune: Messiah',
        type: 'book',
        year: '1969',
        creator: 'Frank Herbert',
        genres: ['Science Fiction', 'Political Intrigue'],
        reason: `Continues the grand philosophical and political space opera saga that ${p2} loves.`,
        matchScore: 95,
        posterUrl: 'https://covers.openlibrary.org/b/id/10522438-L.jpg',
        audience: 'partner2',
      },
    ];
  }

  // Compromise / Shared Mode
  return [
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
      title: 'Overcooked! 2',
      type: 'game',
      year: '2018',
      genres: ['Party', 'Co-op', 'Casual'],
      platforms: ['Switch', 'PS5', 'PC', 'Xbox'],
      reason: `Pure co-op teamwork and chaotic laughter that brings both ${p1} and ${p2} together for 2-player game night.`,
      matchScore: 96,
      posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600',
      audience: 'together',
    },
    {
      title: 'Tomorrow, and Tomorrow, and Tomorrow',
      type: 'book',
      year: '2022',
      creator: 'Gabrielle Zevin',
      genres: ['Fiction', 'Gaming Culture', 'Drama'],
      reason: `An incredible shared 2-person book club read: merges rich character drama with video game nostalgia and worldbuilding.`,
      matchScore: 95,
      posterUrl: 'https://covers.openlibrary.org/b/id/12843003-L.jpg',
      audience: 'together',
    },
    {
      title: 'Palm Springs',
      type: 'movie',
      year: '2020',
      genres: ['Comedy', 'Romance', 'Sci-Fi'],
      reason: `Smart existential time-loop comedy that blends laugh-out-loud wedding banter with great high-concept sci-fi.`,
      matchScore: 94,
      posterUrl: 'https://image.tmdb.org/t/p/w500/1fgjgEPXz2zM2pP1oB1m1L0jV9D.jpg',
      audience: 'together',
    },
  ];
}
