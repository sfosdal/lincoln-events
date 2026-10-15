// The city — every fact that makes this calendar Lincoln's rather than
// another town's, in one place (2026-10-14: split out of the state-wide
// nebraska-events site, which carried Omaha and Lincoln as its two groups,
// when Steve asked for one site per city; Omaha got its own the same night).
// The browser (filter.js, app.js) and the build (scripts/*.mjs) both read it;
// nothing else names a venue or a team. The shared files (app.js, filter.js,
// styles.css bar its --v-* hues, scripts/*.mjs bar fetch-events.mjs and
// sources.mjs) are lqa-events' own, byte for byte — see README "Sister sites".
//
// Loaded before filter.js (a plain script, so the tests can share it): it
// sets globalThis.LQACity (the name is the shared code's, not the city's).
(function (global) {
  'use strict';

  // The home teams, matched on the event title whatever the venue. Order =
  // the Teams strip, left to right; the first match wins (app.js teamFor),
  // so Husker football never claims a basketball or volleyball night.
  // Per team:
  //   re        the title match (Ticketmaster's titles — "Nebraska
  //             Cornhuskers Football vs. …", "Omaha Hockey vs …", "Lincoln
  //             Stars vs. …" — and the injected ones, "<inject.name> vs …")
  //   venue     the home building; schedule = the club's own schedule page
  //   sport     keys the strip icon (app.js SPORT_ICONS), the game clock,
  //             the leader categories. Volleyball has no icon in the shared
  //             table yet (the strip shows the crest alone)
  //   colors    [primary, accent] — the season calendar's home cells and
  //             card frames
  //   espn      ESPN's sport/league/team id — the three Husker programs,
  //             Creighton, Omaha's hockey and Union Omaha (USL League One)
  //             are on ESPN (season, form, news); the Storm Chasers' season
  //             comes from MLB's stats API (Triple-A is on it, sportId 11)
  //             and the Stars' and Lancers' from the USHL's HockeyTech feed
  //   inject    a club whose home dates no ticket feed lists in full: the
  //             league's schedule puts them on the calendar under this
  //             ticket link (name = the injected title's first half)
  //   club      the club's name on Ticketmaster; news the outlets' feeds;
  //             wiki the article (teamPage: college seasons are titled
  //             "2026 Nebraska Cornhuskers football team"); opens when the
  //             season usually starts
  var USHL = { league: 'ushl', key: 'e828f89b243dc43f' }; // HockeyTech's USHL feed (client_code ushl), as Green Bay's Gamblers read it
  var TEAMS = [
    // Nebraska Cornhuskers football, Big Ten, Memorial Stadium in Lincoln.
    // Ticketmaster carries only the marquee Saturdays (two of seven this
    // season), so the rest of the home slate is injected from ESPN
    { slug: 'huskers', label: 'Huskers', name: 'Nebraska Cornhuskers', abbr: 'NEB', re: /nebraska (cornhuskers )?football|husker football/i, sport: 'football', venue: 'Memorial Stadium', colors: ['#e31937', '#ffffff'],
      espn: { sport: 'football', league: 'college-football', id: '158' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      inject: { name: 'Nebraska Football', url: 'https://huskers.com/sports/football/tickets' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/158.png', schedule: 'https://huskers.com/sports/football/schedule',
      club: 'Nebraska Cornhuskers Football', opens: 'late August', wiki: { title: 'Nebraska Cornhuskers football', teamPage: true },
      news: [['https://huskers.com/rss?path=football', 'Huskers.com']] },
    // Nebraska men's basketball, Big Ten, Pinnacle Bank Arena — Ticketmaster lists the home games
    { slug: 'huskersbasketball', label: 'Huskers Basketball', name: 'Nebraska Cornhuskers', abbr: 'NEB', re: /nebraska (cornhuskers )?men'?s basketball/i, sport: 'basketball', venue: 'Pinnacle Bank Arena', colors: ['#e31937', '#000000'],
      espn: { sport: 'basketball', league: 'mens-college-basketball', id: '158' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/158.png', schedule: 'https://huskers.com/sports/mens-basketball/schedule',
      club: "Nebraska Cornhuskers Men's Basketball", opens: 'early November', wiki: { title: "Nebraska Cornhuskers men's basketball", teamPage: true } },
    // Nebraska volleyball, Big Ten, the Bob Devaney Sports Center — the
    // best-attended women's program in the country; Ticketmaster lists the
    // Big Ten weekends, ESPN's schedule fills the rest
    { slug: 'huskersvolleyball', label: 'Huskers Volleyball', name: 'Nebraska Cornhuskers', abbr: 'NEB', re: /nebraska (cornhuskers )?(women'?s )?volleyball|husker volleyball/i, sport: 'volleyball', venue: 'Bob Devaney Sports Center', colors: ['#e31937', '#ffffff'],
      espn: { sport: 'volleyball', league: 'womens-college-volleyball', id: '158' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      inject: { name: 'Nebraska Volleyball', url: 'https://huskers.com/sports/womens-volleyball/tickets' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/158.png', schedule: 'https://huskers.com/sports/womens-volleyball/schedule',
      club: "Nebraska Cornhuskers Women's Volleyball", opens: 'late August', wiki: { title: "Nebraska Cornhuskers women's volleyball", teamPage: true } },
    // Lincoln Stars, USHL, the Ice Box — Ticketmaster lists the home games.
    // Anchored at the title's start: "Omaha Lancers vs. Lincoln Stars" is a
    // Lancers night, not a Stars one
    { slug: 'stars', label: 'Stars', name: 'Lincoln Stars', abbr: 'LIN', re: /^lincoln stars/i, sport: 'hockey', venue: 'The Ice Box', colors: ['#0a2240', '#c8102e'],
      season: { kind: 'hockeytech', league: USHL.league, key: USHL.key, id: 16, leagueName: 'USHL' }, form: { kind: 'hockeytech', league: USHL.league, key: USHL.key, id: 16 },
      logo: 'https://assets.leaguestat.com/ushl/logos/16.png', schedule: 'https://lincolnstars.com/schedule',
      club: 'Lincoln Stars', opens: 'late September', wiki: { title: 'Lincoln Stars' } },
  ];

  // The venues, one record each, by size. Per venue:
  //   capacity how many people the place holds
  //   area     absent on every room — one group, Lincoln; 'town' would
  //            put a room in the panel's second group (the sister sites' pattern)
  //   type     the event type when the title decides nothing
  //   cssVar   the hue styles.css sets for it (dark block --v-*); color
  //            the same hue as a value, for the series graph
  //   url      the venue's own events listing — not a ticket vendor
  //   icon     a mark for listings without a team crest
  //   tm       its Ticketmaster Discovery listing (fetch-events.mjs reads
  //            the venue by id — every page). No city sweep: the metro
  //            would mix with every Iowa and Kansas room the API files under
  //            the same market (and with Omaha's, its own site now). exclude drops the season bundles and the
  //            all-session passes the arenas list beside their events,
  //            parking, suites, tours and the pre-show happy hours
  //   alias    the other spellings the feeds use for it, folded to this name
  // No festivals yet, so the panel's Festivals group folds away (app.js).
  var VENUES = {
    // --- the Huskers' stadium, arena and volleyball hall, the Lied Center, the Haymarket clubs, the Stars' rink ---
    'Memorial Stadium': {
      capacity: 85458,
      type: 'sports',
      cssVar: '--v-memorial',
      color: '#d5ea86',
      url: 'https://huskers.com/sports/football/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=huskers.com&sz=128',
      tm: { id: 'KovZpZA1FnJA', match: 'memorial stadium', fallbackUrl: 'https://huskers.com/sports/football/schedule', exclude: /parking|tailgate|suite|\btours?\b|season tickets?/i },
      alias: /memorial stadium/i,
    },
    'Pinnacle Bank Arena': {
      capacity: 15500,
      type: 'sports',
      cssVar: '--v-pinnacle',
      color: '#86b7ea',
      url: 'https://www.pinnaclebankarena.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.pinnaclebankarena.com&sz=128',
      tm: { id: 'KovZpZAJdEIA', match: 'pinnacle', fallbackUrl: 'https://www.pinnaclebankarena.com/events', exclude: /season tickets?|parking|suite|\btours?\b/i },
      alias: /pinnacle bank arena/i,
    },
    'Bob Devaney Sports Center': {
      capacity: 7907,
      type: 'sports',
      cssVar: '--v-devaney',
      color: '#ea869a',
      url: 'https://huskers.com/sports/womens-volleyball/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=huskers.com&sz=128',
      tm: { id: 'KovZpapy7e', match: 'devaney', fallbackUrl: 'https://huskers.com/sports/womens-volleyball/schedule', exclude: /season tickets?|parking|suite/i },
      alias: /devaney/i,
    },
    'Lied Center for Performing Arts': {
      capacity: 2200,
      type: 'arts',
      cssVar: '--v-lied',
      color: '#86ea8e',
      url: 'https://www.liedcenter.org/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.liedcenter.org&sz=128',
      tm: { id: 'KovZpZA1FtnA', match: 'lied', fallbackUrl: 'https://www.liedcenter.org/events', exclude: /parking|season (tickets?|package)/i },
      alias: /lied center/i,
    },
    'Bourbon Theatre': {
      capacity: 1300,
      type: 'concert',
      cssVar: '--v-bourbon',
      color: '#ab86ea',
      url: 'https://www.bourbontheatre.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.bourbontheatre.com&sz=128',
      tm: { id: 'KovZpZAEdaJA', match: 'bourbon', fallbackUrl: 'https://www.bourbontheatre.com/events', exclude: /parking/i },
      alias: /bourbon theat(er|re)/i,
    },
    'Royal Grove': {
      capacity: 1000,
      type: 'concert',
      cssVar: '--v-royalgrove',
      color: '#eac886',
      url: 'https://www.royalgrovelincoln.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.royalgrovelincoln.com&sz=128',
      tm: { id: 'KovZpZA1Iv7A', match: 'royal grove', fallbackUrl: 'https://www.royalgrovelincoln.com/events', exclude: /parking/i },
      alias: /royal grove/i,
    },
    'The Ice Box': {
      capacity: 4500,
      type: 'sports',
      cssVar: '--v-icebox',
      color: '#86eae6',
      url: 'https://lincolnstars.com/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=lincolnstars.com&sz=128',
      tm: { id: 'Z7r9jZa7ZX', match: 'ice box', fallbackUrl: 'https://lincolnstars.com/schedule', exclude: /season tickets?|flex pack|parking|suite/i },
      alias: /ice box/i,
    },
  };

  // The usual view: every room on — nothing here lists nightly bar programs
  var DEFAULT_ON = ['Memorial Stadium', 'Pinnacle Bank Arena', 'Bob Devaney Sports Center', 'Lied Center for Performing Arts', 'Bourbon Theatre', 'Royal Grove', 'The Ice Box'];
  var DEFAULT_OFF = [];
  var PREFS_KNOWN_FROM = null; // no default-off venue yet, so nothing for saved prefs to be told about

  // Event types: every event lands in exactly one, from its flags, title,
  // then venue. The rows the panel shows, in order.
  var TYPES = [
    { key: 'concert', label: 'Concerts', title: 'Live music — the arena tours, the Bourbon, the Royal Grove and the Haymarket' },
    { key: 'sports', label: 'Sports', title: 'Husker football, basketball and volleyball, the Lincoln Stars, rodeo and monster trucks' },
    { key: 'arts', label: 'Arts & Theater', title: 'The Lied Center — Broadway tours, comedy, dance, the symphony' },
    { key: 'community', label: 'Community', title: 'Festivals, expos, family days' },
  ];
  var MOVIE_VENUE = null; // no cinema here

  // Share codes (?f=CODE): REGISTRY is every filterable key in a fixed
  // order and a code is a bitmask over it, so the list is APPEND-ONLY —
  // adding an entry adds a bit and every existing code keeps meaning what
  // it meant; removing or reordering one changes every link out there.
  // 19 slots from the first build: 4 base-36 digits (a new site, so new codes —
  // nebraska.here.events' codes never meant anything here).
  var CODE_LENGTH = 4;
  var REGISTRY = [
    ['venue', 'Memorial Stadium'], ['venue', 'Pinnacle Bank Arena'], ['venue', 'Bob Devaney Sports Center'], ['venue', 'Lied Center for Performing Arts'], ['venue', 'Bourbon Theatre'], ['venue', 'Royal Grove'], ['venue', 'The Ice Box'],
    ['badge', 'concert'], ['badge', 'sports'], ['badge', 'arts'], ['badge', 'community'],
    ['team', 'huskers'], ['team', 'huskersbasketball'], ['team', 'huskersvolleyball'], ['team', 'stars'],
    ['cap', 'stadium'], ['cap', 'arena'], ['cap', 'hall'], ['cap', 'room'],
  ];

  // The words the page uses for the place
  var WORDS = {
    teamCity: 'Lincoln', // the board drops it from the clubs' names ("Lincoln Stars" → Stars; the Cornhuskers keep their state)
    presetDefault: 'Every room — Memorial Stadium, Pinnacle Bank Arena, the Devaney Center, the Lied Center, the Haymarket clubs and the Ice Box — every team and type',
    presetNeighborhood: 'Lincoln proper only',
    presetBig: 'Only the places that hold 2,000 or more — Memorial Stadium, the arena, the Devaney Center, the Lied Center and the Ice Box',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing Lincoln proper only.', big: 'Showing the big rooms only — Memorial Stadium, the arena, the Devaney Center, the Lied Center and the Ice Box.' },
  };

  global.LQACity = {
    key: 'lincoln',
    name: 'Lincoln',
    site: 'https://lincoln.here.events/',
    userAgent: 'Mozilla/5.0 (compatible; lincoln-events/1.0; +https://lincoln.here.events/)',
    tz: 'America/Chicago', tzName: 'Central', // the city's time zone: the ICS feed's TZID, the game clocks, the poster's footer
    state: "Nebraska", stateOutline: 'M6.6 16.6L6.6 16.2L6.6 15.8L6.6 15.4L6.6 15.1L6.6 14.7L6.6 14.3L6.6 13.9L6.6 13.5L6.0 13.5L5.5 13.5L4.9 13.5L4.3 13.5L3.7 13.5L3.2 13.5L2.6 13.5L2.0 13.5L2.0 12.8L2.0 12.0L2.0 11.2L2.0 10.5L2.0 9.7L2.0 8.9L2.0 8.2L2.0 7.4L2.8 7.4L3.6 7.4L4.4 7.4L5.2 7.4L6.0 7.4L6.8 7.4L7.6 7.4L8.4 7.4L9.2 7.4L10.0 7.4L10.8 7.4L11.6 7.4L12.4 7.4L13.2 7.4L14.0 7.4L14.9 7.4L15.6 7.9L16.0 8.0L16.2 7.9L16.6 7.8L17.2 7.8L17.6 7.8L17.8 8.0L18.1 8.1L18.6 8.3L18.9 8.5L19.0 8.7L19.2 8.9L19.4 8.9L19.5 8.9L19.6 9.2L19.7 9.7L19.8 10.1L20.0 10.4L20.1 10.6L20.1 10.7L20.2 10.9L20.3 11.0L20.3 11.3L20.3 11.7L20.4 11.9L20.5 11.9L20.5 11.9L20.5 12.0L20.5 12.1L20.6 12.1L20.6 12.2L20.6 12.4L20.6 12.5L20.7 12.6L20.8 12.7L20.7 12.8L20.7 12.9L20.8 13.0L20.8 13.3L20.9 13.9L20.9 14.2L20.8 14.3L20.9 14.5L21.0 14.8L21.1 14.9L21.2 15.2L21.3 15.5L21.4 15.7L21.6 15.8L21.7 16.0L21.8 16.3L22.0 16.6L22.0 16.6L21.6 16.6L21.1 16.6L20.6 16.6L20.1 16.6L19.7 16.6L19.2 16.6L18.7 16.6L18.2 16.6L17.7 16.6L17.2 16.6L16.8 16.6L16.3 16.6L15.8 16.6L15.3 16.6L14.8 16.6L14.3 16.6L13.9 16.6L13.4 16.6L12.9 16.6L12.4 16.6L11.9 16.6L11.4 16.6L11.0 16.6L10.5 16.6L10.0 16.6L9.5 16.6L9.0 16.6L8.5 16.6L8.1 16.6L7.6 16.6L7.1 16.6L6.6 16.6Z', // the masthead's small state, linking to here.events (scripts/state-outline.mjs, Natural Earth 1:50m)
    // the calendar feed's header; the UID domain never changes (changing it
    // re-creates every event in subscribers' calendars)
    ics: { name: 'Lincoln Events', short: 'Lincoln Events', teams: 'Lincoln home teams — every season', prodid: '-//here.events//lincoln-events//EN', uidDomain: 'fosdal.net', // the UID domain the whole family issues (the shared ics test pins it)
      desc: 'Upcoming events in Lincoln\, NE — Memorial Stadium\, Pinnacle Bank Arena\, the Devaney Center\, the Lied Center\, the Haymarket clubs and the Ice Box' },
    teams: TEAMS,
    venues: VENUES,
    defaultOn: DEFAULT_ON,
    defaultOff: DEFAULT_OFF,
    prefsKnownFrom: PREFS_KNOWN_FROM,
    types: TYPES,
    movieVenue: MOVIE_VENUE,
    groundsVenue: null, // every listing is read by room, so nothing arrives under a name city.js lacks
    codeLength: CODE_LENGTH,
    registry: REGISTRY,
    words: WORDS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
