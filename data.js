/* ExamRoute Belgium - data file
 *
 * All editable content lives here:
 *   - CITIES: the list of cities, each with one or more exam centers
 *   - ROUTE_OVERRIDES: per-center custom routes (street-by-street paths)
 *   - FLAVORS: the default notes/tags/focus used when a center has no override
 *   - CENTER_FLAVORS: which flavor each center uses
 *
 * To add a new city: append to CITIES.
 * To add a custom route for a center: add an entry to ROUTE_OVERRIDES keyed
 * by the center id, with A/B/C objects containing { path, distanceKm,
 * durationMin, imageUrl }.
 *
 * This file is loaded BEFORE app.js (see index.html) and exposes the data
 * via window.EXAM_ROUTE_DATA.
 */
(function () {
  'use strict';

  // ===================== Helpers =====================
  function tri(nl, en, fr) { return { nl, en, fr }; }
  function gmaps(q) { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q); }
  // Detect coordinate strings in the JSON ("lng,lat" — Belgian longitude
  // comes first, e.g. "5.778682,49.672546"). Returns the swapped
  // "lat,lng" string for Google Maps, or null if not a coord.
  function asCoord(s) {
    const m = /^(-?\d+\.\d+),(-?\d+\.\d+)$/.exec(s);
    if (!m) return null;
    return m[2] + ',' + m[1];
  }
  function isRoadCodeStop(s) {
    return /^(?:[AENR]\.?\d{1,4}(?:\.\d{1,4})*)$/i.test(String(s).trim());
  }
  function isQualifiedStop(s) {
    const trimmed = String(s).trim();
    return /\b\d{4}\b/.test(trimmed) || /,\s*(?:belgium|belgie|belgië|belgique)$/i.test(trimmed);
  }
  function gmapsPath(path, cityName) {
    if (!path || path.length < 2) return null;
    const navigationPath = path.filter((p, index) => {
      const isEndpoint = index === 0 || index === path.length - 1;
      return isEndpoint || !isRoadCodeStop(p);
    });
    const segments = navigationPath.map(p => {
      const coord = asCoord(p);
      const place = coord || (isQualifiedStop(p) ? String(p).trim() : (p + ', ' + cityName));
      return encodeURIComponent(place).replace(/%20/g, '+');
    });
    return 'https://www.google.com/maps/dir/' + segments.join('/');
  }
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  // ===================== Route flavor system =====================
  // Each flavor provides distinct A/B/C focus + notes + tags that reflect
  // the real driving context (Brussels trams, coastal wind, Ardennes, etc.)
  const FLAVORS = {
    'flemish-urban': {
      A: {
        focus: tri('Druk stadsverkeer met trams en fietsers', 'Busy city traffic with trams and cyclists', 'Trafic urbain dense avec trams et cyclistes'),
        notes: [
          tri('Let op tramsporen bij het draaien.', 'Watch for tram tracks when turning.', 'Attention aux rails de tram en tournant.'),
          tri('Fietsstraten: fietsers krijgen voorrang.', 'Cycle streets: cyclists have priority.', 'Rues cyclables : priorité aux cyclistes.'),
          tri('Eenrichtingsstraten goed lezen.', 'Read one-way signs carefully.', 'Lisez bien les sens uniques.')
        ],
        tags: [tri('Tram','Tram','Tram'), tri('Fietsstraat','Cycle street','Rue cyclable'), tri('Eenrichting','One-way','Sens unique')]
      },
      B: {
        focus: tri('Fileparkeren tussen voertuigen', 'Parallel parking between vehicles', 'Créneau entre véhicules'),
        notes: [
          tri('Fileparkeren in smalle stadsstraten.', 'Parallel parking in narrow city streets.', 'Créneau dans des rues étroites.'),
          tri('Let op uitstappende passagiers.', 'Watch for passengers exiting cars.', 'Attention aux passagers qui sortent.'),
          tri('Spiegels en dode hoek bij wegrijden.', 'Mirrors and blind spot when pulling out.', 'Rétros et angle mort au démarrage.')
        ],
        tags: [tri('Fileparkeren','Parallel parking','Créneau'), tri('Smal','Narrow','Étroit'), tri('Dode hoek','Blind spot','Angle mort')]
      },
      C: {
        focus: tri('Ringweg en gewestwegen', 'Ring road and regional roads', 'Ring et routes régionales'),
        notes: [
          tri('Vlot invoegen op de ring.', 'Merge smoothly onto the ring.', 'Insertion fluide sur le ring.'),
          tri('Snelheid aanpassen aan borden.', 'Adjust speed to signage.', 'Adaptez la vitesse à la signalisation.'),
          tri('Anticipeer op afritten.', 'Anticipate exits.', 'Anticipez les sorties.')
        ],
        tags: [tri('Ring','Ring road','Ring'), tri('Invoegen','Merging','Insertion'), tri('100 km/u','100 km/h','100 km/h')]
      }
    },
    'flemish-rural': {
      A: {
        focus: tri('Dorpskernen en landwegen', 'Village centers and country roads', 'Centres de village et routes de campagne'),
        notes: [
          tri('Voorrang van rechts in dorpsstraten.', 'Right of way from the right in villages.', 'Priorité de droite dans les villages.'),
          tri('Let op landbouwvoertuigen.', 'Watch for agricultural vehicles.', 'Attention aux véhicules agricoles.'),
          tri('Zone 30 bij scholen.', '30 km/h zones near schools.', 'Zone 30 près des écoles.')
        ],
        tags: [tri('Voorrang rechts','Right of way','Priorité droite'), tri('Zone 30','30 zone','Zone 30'), tri('Tractor','Tractor','Tracteur')]
      },
      B: {
        focus: tri('Manoeuvres op rustig parkeerterrein', 'Manoeuvres on a quiet parking lot', 'Manœuvres sur parking calme'),
        notes: [
          tri('Achteruit inparkeren met referentiepunten.', 'Reverse parking using reference points.', 'Marche arrière avec points de repère.'),
          tri('Halve draai op een kruispunt.', 'U-turn at a quiet intersection.', 'Demi-tour à un carrefour calme.'),
          tri('Hellingproef indien beschikbaar.', 'Hill start if available.', 'Démarrage en côte si disponible.')
        ],
        tags: [tri('Achteruit','Reversing','Marche arrière'), tri('Keren','U-turn','Demi-tour'), tri('Helling','Hill start','Côte')]
      },
      C: {
        focus: tri('Gewestwegen N-routes', 'N-roads regional loop', 'Routes N régionales'),
        notes: [
          tri('Inhalen alleen waar toegestaan.', 'Overtake only where allowed.', 'Dépassement seulement où autorisé.'),
          tri('Wisselende snelheidslimieten 70/90.', 'Variable 70/90 km/h limits.', 'Limites variables 70/90.'),
          tri('Let op overstekend wild.', 'Watch for crossing wildlife.', 'Attention au gibier traversant.')
        ],
        tags: [tri('N-weg','N-road','Route N'), tri('Inhalen','Overtaking','Dépassement'), tri('90 km/u','90 km/h','90 km/h')]
      }
    },
    'coastal': {
      A: {
        focus: tri('Kuststad met toeristen en zijwind', 'Coastal city with tourists and side wind', 'Ville côtière, touristes et vent latéral'),
        notes: [
          tri('Veel voetgangers en fietsverhuur.', 'Many pedestrians and rented bikes.', 'Beaucoup de piétons et vélos loués.'),
          tri('Zijwind op brede boulevards.', 'Side wind on wide boulevards.', 'Vent latéral sur les boulevards.'),
          tri('Trager rijden in toeristenzones.', 'Drive slowly in tourist zones.', 'Roulez lentement en zone touristique.')
        ],
        tags: [tri('Toerisme','Tourism','Tourisme'), tri('Wind','Wind','Vent'), tri('Voetgangers','Pedestrians','Piétons')]
      },
      B: {
        focus: tri('Parkeren langs de zeedijk', 'Parking along the seafront', 'Stationnement en bord de mer'),
        notes: [
          tri('Drukke parkeerstroken bij goed weer.', 'Crowded bays in good weather.', 'Places très demandées par beau temps.'),
          tri('Betalend parkeren — let op markeringen.', 'Paid parking — watch markings.', 'Stationnement payant — vérifiez les marquages.'),
          tri('Smalle straten in oud centrum.', 'Narrow streets in old center.', 'Rues étroites dans le vieux centre.')
        ],
        tags: [tri('Zeedijk','Seafront','Digue'), tri('Smal','Narrow','Étroit'), tri('Betalend','Paid','Payant')]
      },
      C: {
        focus: tri('Polderwegen en haveninfra', 'Polder roads and port infrastructure', 'Routes des polders et port'),
        notes: [
          tri('Lange rechte stukken — snelheid bewaken.', 'Long straights — monitor speed.', 'Longues lignes droites — surveillez la vitesse.'),
          tri('Vrachtwagens uit havenzone.', 'Trucks from port area.', 'Camions de la zone portuaire.'),
          tri('Bruggen en sluizen mogelijk open.', 'Bridges and locks may be open.', 'Ponts et écluses parfois ouverts.')
        ],
        tags: [tri('Polder','Polder','Polder'), tri('Haven','Port','Port'), tri('Brug','Bridge','Pont')]
      }
    },
    'brussels': {
      A: {
        focus: tri('Hoofdstad: trams, bussen en taxi\'s', 'Capital: trams, buses and taxis', 'Capitale : trams, bus et taxis'),
        notes: [
          tri('Tram- en busbanen niet inrijden.', 'Do not enter tram or bus lanes.', 'N\'entrez pas dans les couloirs tram/bus.'),
          tri('Veel kruispunten met camera\'s.', 'Many camera-monitored intersections.', 'Beaucoup de carrefours sous caméra.'),
          tri('Tweetalige bewegwijzering: NL + FR.', 'Bilingual signage: NL + FR.', 'Signalisation bilingue : NL + FR.')
        ],
        tags: [tri('Tram','Tram','Tram'), tri('Busbaan','Bus lane','Couloir bus'), tri('Tweetalig','Bilingual','Bilingue')]
      },
      B: {
        focus: tri('Fileparkeren in drukke wijk', 'Parallel parking in a busy district', 'Créneau en quartier animé'),
        notes: [
          tri('Blauwe zone en betalend parkeren.', 'Blue zone and paid parking.', 'Zone bleue et stationnement payant.'),
          tri('Krappe plaatsen tussen geparkeerde wagens.', 'Tight spots between parked cars.', 'Places serrées entre voitures.'),
          tri('Let op scooters die voorbijrijden.', 'Watch for passing scooters.', 'Attention aux scooters qui dépassent.')
        ],
        tags: [tri('Blauwe zone','Blue zone','Zone bleue'), tri('Krap','Tight','Serré'), tri('Scooter','Scooter','Scooter')]
      },
      C: {
        focus: tri('Kleine ring en tunnels', 'Inner ring and tunnels', 'Petite ceinture et tunnels'),
        notes: [
          tri('Tunnels: licht aan, afstand houden.', 'Tunnels: lights on, keep distance.', 'Tunnels : feux allumés, distance.'),
          tri('Korte invoegstroken op de ring.', 'Short merge lanes on the ring.', 'Voies d\'insertion courtes.'),
          tri('Drukte tijdens spits — anticipeer.', 'Heavy rush-hour traffic — anticipate.', 'Trafic dense aux heures de pointe.')
        ],
        tags: [tri('Tunnel','Tunnel','Tunnel'), tri('Ring','Ring','Ring'), tri('Spits','Rush hour','Heure de pointe')]
      }
    },
    'walloon-urban': {
      A: {
        focus: tri('Stadscentrum met heuvels', 'City center with hills', 'Centre-ville avec dénivelés'),
        notes: [
          tri('Hellingen — gebruik de handrem.', 'Slopes — use the handbrake.', 'Côtes — utilisez le frein à main.'),
          tri('Kasseien en oude straten.', 'Cobblestones and old streets.', 'Pavés et rues anciennes.'),
          tri('Veel eenrichtingsstraten in centrum.', 'Many one-way streets downtown.', 'Beaucoup de sens uniques au centre.')
        ],
        tags: [tri('Helling','Hill','Côte'), tri('Kasseien','Cobbles','Pavés'), tri('Eenrichting','One-way','Sens unique')]
      },
      B: {
        focus: tri('Parkeren op een helling', 'Parking on a slope', 'Stationnement en pente'),
        notes: [
          tri('Wielen draaien volgens helling.', 'Turn wheels according to slope.', 'Tournez les roues selon la pente.'),
          tri('Handrem altijd aanspannen.', 'Always engage handbrake.', 'Serrez toujours le frein à main.'),
          tri('Vertrek in helling oefenen.', 'Practise hill starts.', 'Pratiquez le démarrage en côte.')
        ],
        tags: [tri('Helling','Slope','Pente'), tri('Handrem','Handbrake','Frein à main'), tri('Vertrek','Start','Démarrage')]
      },
      C: {
        focus: tri('Maasvallei en E25/E40', 'Meuse valley and E25/E40', 'Vallée de la Meuse et E25/E40'),
        notes: [
          tri('Vlot invoegen op de autosnelweg.', 'Merge smoothly onto motorway.', 'Insertion fluide sur autoroute.'),
          tri('Tunnels en viaducten — wind mogelijk.', 'Tunnels and viaducts — wind possible.', 'Tunnels et viaducs — vent possible.'),
          tri('Vrachtverkeer rechts houden.', 'Trucks stay right.', 'Les camions à droite.')
        ],
        tags: [tri('Autosnelweg','Motorway','Autoroute'), tri('Viaduct','Viaduct','Viaduc'), tri('Vracht','Trucks','Camions')]
      }
    },
    'rural-ardennes': {
      A: {
        focus: tri('Kleine dorpskernen', 'Small village centers', 'Petits centres de village'),
        notes: [
          tri('Voorrang van rechts strikt toegepast.', 'Right of way strictly applied.', 'Priorité de droite stricte.'),
          tri('Smalle straten met geparkeerde wagens.', 'Narrow streets with parked cars.', 'Rues étroites avec voitures garées.'),
          tri('Mogelijk gebrekkige bewegwijzering.', 'Signage may be limited.', 'Signalisation parfois limitée.')
        ],
        tags: [tri('Voorrang rechts','Right of way','Priorité droite'), tri('Smal','Narrow','Étroit'), tri('Dorp','Village','Village')]
      },
      B: {
        focus: tri('Manoeuvres met beperkte ruimte', 'Manoeuvres in limited space', 'Manœuvres en espace réduit'),
        notes: [
          tri('Achteruit op smalle parking.', 'Reversing in tight parking.', 'Marche arrière en parking étroit.'),
          tri('Keren op een onverharde berm.', 'U-turn on an unpaved verge.', 'Demi-tour sur bas-côté.'),
          tri('Goed observeren — weinig licht.', 'Observe well — limited light.', 'Bien observer — peu d\'éclairage.')
        ],
        tags: [tri('Krap','Tight','Serré'), tri('Berm','Verge','Bas-côté'), tri('Keren','U-turn','Demi-tour')]
      },
      C: {
        focus: tri('Beboste wegen en heuvels', 'Forest roads and hills', 'Routes forestières et collines'),
        notes: [
          tri('Overstekend wild, vooral dageraad/avond.', 'Wildlife crossing at dawn/dusk.', 'Gibier à l\'aube et au crépuscule.'),
          tri('Bochten met afnemende straal.', 'Decreasing-radius bends.', 'Virages à rayon décroissant.'),
          tri('Hellingen — schakel correct.', 'Slopes — shift correctly.', 'Côtes — passez les vitesses correctement.')
        ],
        tags: [tri('Wild','Wildlife','Gibier'), tri('Bocht','Bend','Virage'), tri('Bos','Forest','Forêt')]
      }
    },
    'industrial-walloon': {
      A: {
        focus: tri('Voormalige industriewijken', 'Former industrial districts', 'Anciens quartiers industriels'),
        notes: [
          tri('Veel rotondes — correct neme.', 'Many roundabouts — take correctly.', 'Beaucoup de ronds-points — bien les aborder.'),
          tri('Tramlijnen in Charleroi-zone.', 'Tram lines in the Charleroi area.', 'Lignes de tram dans la zone Charleroi.'),
          tri('Wegversmallingen en werken mogelijk.', 'Lane narrowings and works possible.', 'Rétrécissements et travaux possibles.')
        ],
        tags: [tri('Rotonde','Roundabout','Rond-point'), tri('Tram','Tram','Tram'), tri('Werken','Roadworks','Travaux')]
      },
      B: {
        focus: tri('Parkeren en manoeuvres', 'Parking and manoeuvres', 'Stationnement et manœuvres'),
        notes: [
          tri('Fileparkeren tussen geparkeerde wagens.', 'Parallel parking between cars.', 'Créneau entre véhicules.'),
          tri('Achteruit met goede observatie.', 'Reverse with thorough observation.', 'Marche arrière bien observée.'),
          tri('Hellingproef — gebruik handrem.', 'Hill start — use handbrake.', 'Démarrage en côte — frein à main.')
        ],
        tags: [tri('Fileparkeren','Parallel','Créneau'), tri('Achteruit','Reverse','Marche arrière'), tri('Helling','Hill','Côte')]
      },
      C: {
        focus: tri('E42/E420 en industriezones', 'E42/E420 and industrial zones', 'E42/E420 et zones industrielles'),
        notes: [
          tri('Veel vrachtverkeer — afstand houden.', 'Heavy truck traffic — keep distance.', 'Trafic camion — gardez vos distances.'),
          tri('Korte op- en afritten.', 'Short entry/exit ramps.', 'Bretelles courtes.'),
          tri('Snelheid 120 km/u op snelweg.', '120 km/h on motorway.', '120 km/h sur autoroute.')
        ],
        tags: [tri('Snelweg','Motorway','Autoroute'), tri('Vracht','Trucks','Camions'), tri('120 km/u','120 km/h','120 km/h')]
      }
    },
    'student-town': {
      A: {
        focus: tri('Studentenstad met veel fietsers', 'Student town with many cyclists', 'Ville étudiante, beaucoup de cyclistes'),
        notes: [
          tri('Massa\'s fietsers — schouderblik essentieel.', 'Lots of cyclists — shoulder check essential.', 'Beaucoup de cyclistes — contrôle d\'épaule essentiel.'),
          tri('Voetgangers steken zonder kijken over.', 'Pedestrians cross without looking.', 'Piétons traversent sans regarder.'),
          tri('Beperkte snelheid — zone 30/50.', 'Limited speed — 30/50 zones.', 'Vitesse limitée — zones 30/50.')
        ],
        tags: [tri('Fietsers','Cyclists','Cyclistes'), tri('Zone 30','30 zone','Zone 30'), tri('Voetgangers','Pedestrians','Piétons')]
      },
      B: {
        focus: tri('Parkeren in campusomgeving', 'Parking around campus', 'Stationnement autour du campus'),
        notes: [
          tri('Drukke campusparkings.', 'Crowded campus lots.', 'Parkings universitaires saturés.'),
          tri('Achteruit met fietsers achter je.', 'Reverse with cyclists behind.', 'Marche arrière avec cyclistes derrière.'),
          tri('Geduld en spiegelgebruik.', 'Patience and mirror use.', 'Patience et usage des rétros.')
        ],
        tags: [tri('Campus','Campus','Campus'), tri('Spiegels','Mirrors','Rétros'), tri('Geduld','Patience','Patience')]
      },
      C: {
        focus: tri('E40/E411 en gewestwegen', 'E40/E411 and regional roads', 'E40/E411 et routes régionales'),
        notes: [
          tri('Vlot invoegen op snelweg.', 'Smooth merge onto motorway.', 'Insertion fluide sur autoroute.'),
          tri('Drukte tijdens semester.', 'Heavy traffic in term-time.', 'Trafic dense en période universitaire.'),
          tri('Afstand houden bij regen.', 'Keep distance in rain.', 'Distance accrue sous la pluie.')
        ],
        tags: [tri('Snelweg','Motorway','Autoroute'), tri('Drukte','Heavy traffic','Affluence'), tri('Regen','Rain','Pluie')]
      }
    },
    'border-de': {
      A: {
        focus: tri('Duitstalig gebied — tweetalige borden', 'German-speaking area — bilingual signs', 'Zone germanophone — panneaux bilingues'),
        notes: [
          tri('Bewegwijzering vaak in het Duits.', 'Signage often in German.', 'Signalisation souvent en allemand.'),
          tri('Grensoverschrijdend verkeer DE.', 'Cross-border traffic with Germany.', 'Trafic transfrontalier avec l\'Allemagne.'),
          tri('Strikte snelheidscontroles.', 'Strict speed enforcement.', 'Contrôles de vitesse stricts.')
        ],
        tags: [tri('Grens','Border','Frontière'), tri('Duits','German','Allemand'), tri('Controle','Enforcement','Contrôle')]
      },
      B: {
        focus: tri('Manoeuvres in heuvelachtig terrein', 'Manoeuvres in hilly terrain', 'Manœuvres en terrain vallonné'),
        notes: [
          tri('Parkeren op een helling.', 'Parking on a slope.', 'Stationnement en pente.'),
          tri('Wielen correct draaien.', 'Turn wheels correctly.', 'Tournez les roues correctement.'),
          tri('Handrem en versnelling kiezen.', 'Handbrake and gear choice.', 'Frein à main et bon rapport.')
        ],
        tags: [tri('Helling','Slope','Pente'), tri('Handrem','Handbrake','Frein à main'), tri('Schakelen','Shifting','Passer les vitesses')]
      },
      C: {
        focus: tri('Eifel-aanloop en E40', 'Eifel approach and E40', 'Accès Eifel et E40'),
        notes: [
          tri('Stijgingen op landwegen.', 'Climbs on country roads.', 'Côtes sur routes de campagne.'),
          tri('Mistgevoelig in herfst/winter.', 'Foggy in autumn/winter.', 'Brouillard automne/hiver.'),
          tri('Wegen kunnen smal worden.', 'Roads can narrow.', 'Routes parfois étroites.')
        ],
        tags: [tri('Heuvels','Hills','Collines'), tri('Mist','Fog','Brouillard'), tri('Smal','Narrow','Étroit')]
      }
    }
  };

  // Centers → flavor mapping (per center id).
  const CENTER_FLAVORS = {
    'antwerpen-deurne': 'flemish-urban',
    'kontich-1': 'flemish-urban',
    'geel-1': 'flemish-rural',
    'alken-1': 'flemish-rural',
    'bree-1': 'flemish-rural',
    'brugge-1': 'coastal',
    'oostende-1': 'coastal',
    'roeselare-1': 'flemish-rural',
    'wevelgem-1': 'flemish-rural',
    'gent-sdw': 'flemish-urban',
    'sintniklaas-1': 'flemish-rural',
    'eeklo-1': 'flemish-rural',
    'erembodegem-1': 'flemish-rural',
    'assemollem-1': 'flemish-urban',
    'haasrode-1': 'student-town',
    'anderlecht-1': 'brussels',
    'schaerbeek-1': 'brussels',
    'couillet-1': 'industrial-walloon',
    'braine-1': 'industrial-walloon',
    'mariembourg-1': 'rural-ardennes',
    'arlon-1': 'rural-ardennes',
    'bastogne-1': 'rural-ardennes',
    'marche-1': 'rural-ardennes',
    'wandre-1': 'walloon-urban',
    'suarlee-1': 'walloon-urban',
    'tournai-1': 'industrial-walloon',
    'lln-1': 'student-town',
    'eupen-1': 'border-de',
    'lobbes-1': 'industrial-walloon',
    'tihange-1': 'walloon-urban',
    'cuesmes-1': 'industrial-walloon'
  };

  // ===================== Per-center route overrides =====================
  // Add an entry here when you want to define the exact street-by-street
  // path for a center's routes. Each route override may include:
  //   path:        [streets...] — first and last are origin/destination
  //   distanceKm:  number
  //   durationMin: number
  //   imageUrl:    string — image displayed on the route card
  const ROUTE_OVERRIDES = {
    'gent-sdw': {
      city: 'Gent',
      A: {
        path: ['Poortakkerstraat', 'Kleinkouterken', 'Steenaardestraat', 'Beukenlaan', 'Stormvogelstraat', 'B402', 'Poortakkerstraat'],
        distanceKm: 11, durationMin: 22,
        imageUrl: 'assets/GentrouteA.png'
      },
      B: {
        path: ['Poortakkerstraat', 'Louis Blerotlaan', 'R4', 'Renbaanstraat', 'Rijsenbergstraat', 'Aaigemstraat', 'Koningin Fabiolalaan', 'Sint-Denijslaan', 'Poortakkerstraat'],
        distanceKm: 46, durationMin: 61,
        imageUrl: 'assets/GentrouteB.png'
      },
      C: {
        path: ['Poortakkerstraat', 'Bijenstraat', 'Twaalfapostelenstraat', 'Kortrijksesteenweg', 'Zieklien', 'Voskenslaan', 'Valentin Vaerwyckweg', 'Poortakkerstraat'],
        distanceKm: 13, durationMin: 26,
        imageUrl: 'assets/GentrouteC.png'
      }
    },

    // Paths below are preserved EXACTLY as in the JSON source — including
    // GPS waypoints (lng,lat) and consecutive duplicates. The coordinates
    // act as routing anchors that force Maps to follow the real practice
    // route instead of computing its own shortest path.
    'alken-1': {
      city: 'Alken',
      A: { path: ['Pickardstraat', 'Stationsstraat', 'N80', 'Luikersteenweg', 'Zomerstraat', '5.345671,50.917724', 'Sint-Martinusplein', 'de Geloesplein', 'Prins-Bisschopssingel', 'Sint-Truidersteenweg', 'Pickardstraat'], imageUrl: 'assets/AlkenrouteA.png' },
      B: { path: ['Pickardstraat', 'Meerdegatstraat', 'Steenweg', 'Trekschurenstraat', 'Kliniekstraat', 'Prins-Bisschopssingel', 'Danielstraat', 'Oude Luikerbaan', 'Kruisherenlaan', 'Slagerslaan', 'Boerenkrijgsingel', 'N80', 'Pickardstraat'], imageUrl: 'assets/AlkenrouteB.png' },
      C: { path: ['Pickardstraat', 'Kolmenstraat', 'N80', 'Sint-Truidersteenweg', 'Vorststraat', 'Paenhuisstraat', 'Pastorijstraat', 'Graaf de Brigodestraat', 'Lindenhofstraat', 'Beukenhoflaan', 'Sint-Truidersteenweg', 'Stationsstraat', 'Pickardstraat'], imageUrl: 'assets/AlkenrouteC.png' },
      D: { path: ['Pickardstraat', 'Papenakkerstraat', 'Rode-Kruisstraat', 'Lindenhofstraat', 'Kapelhofstraat', 'Sint-Truidersteenweg', 'N80', 'Pickardstraat'], imageUrl: 'assets/AlkenrouteD.png' },
      E: { path: ['Pickardstraat', 'Jardinstraat', 'N80', 'Notelarenstraat', 'Jagersstraat', 'Sint-Hubertusplein', 'Boerenkrijgsingel', 'Sint-Truidersteenweg', 'Pickardstraat'], imageUrl: 'assets/AlkenrouteE.png' },
      F: { path: ['Pickardstraat', 'N80', 'Sint-Truidersteenweg', 'Elzenstraat', 'Abelenstraat', 'Boomkensstraat', 'Boomkensstraat', 'Kruisherenlaan', 'Sint-Hubertusplein', 'Kramerslaan', 'Slagerslaan', 'Boerenkrijgsingel', 'Sint-Truidersteenweg', 'Kolmenstraat'], imageUrl: 'assets/AlkenrouteF.png' }
    },

    'arlon-1': {
      city: 'Arlon',
      A: { path: ['Rue Claude Berg', 'E411', 'E25', '5.778682,49.672546', 'Rue de la Posterie', 'Rue de Neufchateau', 'Rue de Neufchateau', 'Rue de Viville', 'Rue des Faubourgs', 'Rue Leon Castilhon', 'Rue Zenobe Gramme', 'Rue Zenobe Gramme', 'Rue de Toernich', 'Rue de Toernich', 'Rue de Sesselich', 'Rue du General Jourdan', 'N81', 'Rue Claude Berg'], imageUrl: 'assets/ArlonrouteA.png' },
      B: { path: ['Rue Claude Berg', 'Avenue de Longwy', 'Chemin de Clairefontaine', 'Chemin des Espagnols', 'Avenue de Mersch', 'Rue Paul Reuter', 'Avenue de la Gare', 'Rue Francq', 'Rue Francq', 'Square Albert-1er', 'Rue Jean Koch', 'Place des Fusilles', 'Place de l\'Yser', 'Rue de Toernich', 'Rue de Toernich', 'Rue de la Gaume', 'Rue du General Jourdan', 'Route de Longwy', 'N81', 'Rue Claude Berg'], imageUrl: 'assets/ArlonrouteB.png' },
      C: { path: ['Rue Claude Berg', '5.820002,49.652824', 'Rue du General Jourdan', 'Rue de Sesselich', 'N817', 'Avenue Jean-Baptiste Nothomb', 'Square Albert-1er', 'Rue Saint-Jean', 'Rue Paul Reuter', 'Place des Chasseurs Ardennais', 'Rue de la Caserne', 'Rue des Martyrs', 'Square Albert-1er', 'Rue des Martyrs', 'Rue de Bastogne', 'N4', 'Avenue de Longwy', 'Avenue de Longwy', '5.820504,49.65278', 'Rue Claude Berg'], imageUrl: 'assets/ArlonrouteC.png' },
      D: { path: ['Rue Claude Berg', '5.820002,49.652824', 'Avenue de Longwy', 'Avenue du General Patton', 'Rue de la Semois', 'Rue Zenobe Gramme', 'Rue Leon Castilhon', 'Rue de Neufchateau', 'Rue de Neufchateau', 'Rue de Bastogne', 'Rue des Melezes', 'N4', 'Avenue de Longwy', 'Rue des Deportes', 'Avenue Victor Tesch', 'Avenue du General Patton', 'Avenue du General Patton', 'Route de Longwy', '5.820504,49.65278', 'Rue Claude Berg'], imageUrl: 'assets/ArlonrouteD.png' },
      E: { path: ['Rue Claude Berg', 'Avenue de Longwy', 'Rue des Deportes', 'Rue de la Synagogue', 'Rue de la Caserne', 'Rue Nicolas Berger', 'Rue de Viville', 'Avenue du Galgenberg', 'Avenue du Galgenberg', 'Avenue du Galgenberg', 'Rue de Neufchateau', 'E25', 'E25', 'E411', 'N81', 'Rue Claude Berg'], imageUrl: 'assets/ArlonrouteE.png' },
      F: { path: ['Rue Claude Berg', 'Avenue de Longwy', 'Avenue du General Patton', 'N817', 'Rue des Deportes', 'Avenue de Longwy', 'N4', 'Rue de Bastogne', 'Rue Sainte-Croix', 'Rue du Moulin Lampach', 'Avenue du Galgenberg', 'Rue de Neufchateau', 'Rue des Martyrs', 'Rue Joseph Netzer', 'Rue Joseph Netzer', 'Avenue du General Patton', 'Avenue de Longwy', 'N81', 'Rue Claude Berg'], imageUrl: 'assets/ArlonrouteF.png' }
    },

    'assemollem-1': {
      city: 'Asse',
      A: { path: ['Z. 5 Mollem', 'Velm', 'Kouter', 'Schermershoek', 'Ichelgemstraat', 'Mieregemstraat', 'Slagmolenlaan', 'Reedijk', 'Dooren', 'Z. 5 Mollem'], imageUrl: 'assets/AsseMollemrouteA.png' },
      B: { path: ['Z. 5 Mollem', 'Dorpstraat', 'Brussegemplein', 'Brussegemkerkstraat', 'Nieuwelaan', 'Vollickstraat', 'Kasteelstraat', 'Kasteelstraat', 'Brusselsesteenweg', 'Hennekenmolen', 'Ganzenbos', 'Z. 5 Mollem'], imageUrl: 'assets/AsseMollemrouteB.png' },
      C: { path: ['Z. 5 Mollem', 'Vaal', 'Lindelaan', 'Rozelaarstraat', 'Lindendries', 'Stevensveld', 'Heilig Hartlaan', 'Ganzenbos', 'Z. 5 Mollem'], imageUrl: 'assets/AsseMollemrouteC.png' },
      D: { path: ['Z. 5 Mollem', 'Kalkoven', 'Koningin Astridstraat', 'Koensborre', 'Putberg', 'Heedstraat', 'Keierberg', 'Muurveld', 'Kattestraat', 'Gemeenteplein', 'Z. 5 Mollem'], imageUrl: 'assets/AsseMollemrouteD.png' },
      E: { path: ['Z. 5 Mollem', 'Putberg', 'Kapellestraat', 'Lepelstraat', 'Heuvelstraat', 'Groenstraat', 'Gentsesteenweg', 'Kelestraat', 'Dendermondsesteenweg', 'Z. 5 Mollem'], imageUrl: 'assets/AsseMollemrouteE.png' },
      F: {
        path: ['Z. 5 Mollem', 'Mieregemstraat', 'Slagmolenlaan', 'Vesten', 'Stationsstraat', 'Peperstraat', 'Spiegellaan', 'August De Boeckstraat', 'Brusselsesteenweg', 'Z. 5 Mollem'],
        navigationPath: ['Z. 5 Mollem, 1730 Asse', 'Mieregemstraat, 1730 Asse', 'Slagmolenlaan, 1730 Asse', 'Vesten 40, 1785 Merchtem', 'Stationsstraat, 1785 Merchtem', 'Peperstraat, 1785 Merchtem', 'Spiegellaan, 1785 Merchtem', 'August De Boeckstraat, 1785 Merchtem', 'Brusselsesteenweg, 1785 Merchtem', 'Z. 5 Mollem, 1730 Asse'],
        imageUrl: 'assets/AsseMollemrouteF.png'
      }
    },

    'bastogne-1': {
      city: 'Bastogne',
      A: { path: ['Rue du Marche Couvert', 'Rue de la Fagne d\'Hi', 'Rue des Abattoirs', 'Rue du Fortin', '5.69966,49.990853', 'Avenue Olivier', 'Chemin de Renval', 'Route de Marche', 'N4', 'Rue du Marche Couvert'], imageUrl: 'assets/BastognerouteA.png' },
      B: { path: ['Rue du Marche Couvert', 'Rue de la Fagne d\'Hi', 'Rue du Fortin', 'Rue des Tanneurs', 'Place General Mac-Auliffe', 'Rue des Jardins', 'Rue des Quatre-Bras', 'Rue Lejeune', 'Rue de l\'American Legion', 'Rue de la Californie', 'Rue de la Chapelle', 'Chaussee d\'Arlon', 'Chaussee d\'Arlon', 'N4', 'Rue du Marche Couvert', 'Rue du Marche Couvert'], imageUrl: 'assets/BastognerouteB.png' },
      C: { path: ['Rue du Marche Couvert', '5.692905,49.977639', '5.670981,49.969103', 'E25', 'E25', 'A.026.204', 'Chaussee Romaine', 'Rue de la Petite Bovire', 'Rue de la Petite Bovire', 'Rue des Genets', 'Rue des Genets', 'Route de Marche', 'Rue de Neufchateau', 'Rue de Neufchateau', 'Rue du Marche Couvert', 'Rue du Marche Couvert'], imageUrl: 'assets/BastognerouteC.png' },
      D: { path: ['Rue du Marche Couvert', 'Rue du Vieux-Moulin', 'Rue du Vivier', 'Rue Jean-Beck', 'Rue des Remparts', 'Rue de Musy', 'Rue de Neufchateau', 'Rue de l\'Arbre', 'Rue du Marche Couvert'], imageUrl: 'assets/BastognerouteD.png' },
      E: { path: ['Rue du Marche Couvert', 'N854', 'Rue Pierre Thomas', 'Rue Pierre Thomas', 'Rue du Vivier', 'Rue de la Citadelle', 'Chaussee d\'Arlon', 'Rue du Marche Couvert'], imageUrl: 'assets/BastognerouteE.png' },
      F: { path: ['Rue du Marche Couvert', 'Porte-de-Treves', 'Rue Pierre Thomas', 'Rue du 1er d\'Artillerie', 'Rue de La-Roche', 'Route de Marche', 'N4', 'Rue du Marche Couvert'], imageUrl: 'assets/BastognerouteF.png' }
    },

    'braine-1': {
      city: 'Braine-le-Comte',
      A: { path: ['Avenue du Marouset', 'Avenue du Marouset', 'Rue Emile Heuchon', 'Rue de la Station', 'Rue de Bruxelles', 'Place des Postes', 'Rue de l\'Ecole Normale', 'Rue Adolphe Gillis', 'Rue Hector Denis', 'Place Rene Branquart', 'Rue Emile Heuchon', 'Avenue du Marouset'], imageUrl: 'assets/Braine-le-Comter-routeA.png' },
      B: { path: ['Avenue du Marouset', 'Avenue de la Houssiere', 'Avenue de la Houssiere', 'Rue Emile Heuchon', 'Rue du Onze Novembre', 'Rue d\'Ecaussinnes', 'Avenue Alix de Namur', 'Chaussee de Mons', 'Rue de Mons', 'Grand Place', 'Rue du Viaduc', 'Chemin de Feluy', 'Avenue du Marouset'], imageUrl: 'assets/Braine-le-Comter-routeB.png' },
      C: { path: ['Avenue du Marouset', 'Chemin des Dames', 'Chemin des Dames', 'Chemin des Dames', 'Chemin des Dames', 'Chemin des Dames', 'Chemin du Chevauchoire de Binche', 'Chemin du Chevauchoire de Binche', 'Rue des Freres Dulait', 'Rue des Freres Dulait', 'Rue du 11 Novembre', 'Place Rene Branquart', 'Rue de la Station', 'Rue Rey Aine', 'Rue de la Brainette', 'Rue Edouard Etienne', 'Rue du Viaduc', 'Chemin de Feluy', 'Avenue du Marouset', 'Avenue du Marouset'], imageUrl: 'assets/Braine-le-Comter-routeC.png' },
      D: { path: ['Avenue du Marouset', 'Rue Edouard Etienne', 'Rue Vieille Chaussee', 'Rue de l\'Enseignement', 'Rue Emile Heuchon', 'Avenue du Marouset'], imageUrl: 'assets/Braine-le-Comter-routeD.png' },
      E: { path: ['Avenue du Marouset', 'Rue de la Croix Huart', 'Rue des Etangs', 'Rue du Nord', 'Rue Laterale', 'Rue Emile Heuchon', 'Rue Adolphe Gillis', 'Rue de l\'Ecole Normale', 'Rue de l\'Enseignement', 'Rue de Mons', 'Chaussee de Mons', 'Avenue Alix de Namur', 'Avenue Alix de Namur', 'Rue d\'Ecaussinnes', 'Chemin du Pont', 'Chemin du Chevauchoire de Binche', 'Chemin du Baudriquin', 'Chemin du Baudriquin', 'Avenue du Marouset', 'Avenue du Marouset'], imageUrl: 'assets/Braine-le-Comter-routeE.png' },
      F: { path: ['Avenue du Marouset', 'Avenue du Marouset', 'Rue du Viaduc', 'Rue des Digues', 'Rue de Bruxelles', 'Place des Postes', 'Rue Charles Mahieu', 'Rue de Mons', 'Rue d\'Ecaussinnes', 'Chaussee d\'Ecaussinnes', 'Chemin du Pont', 'Rue Neuve', 'Rue Hector Denis', 'Rue de la Station', 'Rue Rey Aine', 'N533', 'Rue de la Croix Huart', 'Rue Chapelle a fourmis', 'Avenue de la Houssiere', 'Avenue de la Houssiere'], imageUrl: 'assets/Braine-le-Comter-routeF.png' }
    }
  };

  // ===================== Route builders =====================
  function variance(centerId, route, base, spread) {
    const h = hashStr(centerId + route);
    const offset = (h % (spread * 2 + 1)) - spread;
    return Math.max(1, base + offset);
  }

  // Letters beyond C reuse the A/B/C flavor (cyclic) for focus/notes/tags.
  const LETTER_FLAVOR_CYCLE = { A: 'A', B: 'B', C: 'C', D: 'A', E: 'B', F: 'C' };

  function makeRoutes(centerId, address, cityName) {
    const flavorKey = CENTER_FLAVORS[centerId] || 'flemish-rural';
    const f = FLAVORS[flavorKey];
    const diffMap = {
      A: tri('Gemiddeld', 'Medium', 'Moyen'),
      B: tri('Makkelijk', 'Easy', 'Facile'),
      C: tri('Moeilijk', 'Hard', 'Difficile'),
      D: tri('Gemiddeld', 'Medium', 'Moyen'),
      E: tri('Makkelijk', 'Easy', 'Facile'),
      F: tri('Moeilijk', 'Hard', 'Difficile')
    };
    const base = {
      A: { dist: 12, dur: 35, distSpread: 3, durSpread: 6 },
      B: { dist: 6, dur: 25, distSpread: 2, durSpread: 5 },
      C: { dist: 24, dur: 45, distSpread: 5, durSpread: 9 },
      D: { dist: 14, dur: 38, distSpread: 3, durSpread: 6 },
      E: { dist: 8, dur: 28, distSpread: 2, durSpread: 5 },
      F: { dist: 22, dur: 42, distSpread: 5, durSpread: 8 }
    };
    const overrides = ROUTE_OVERRIDES[centerId] || {};
    // If the center has overrides for A-F, generate one route per override
    // letter. Otherwise default to A/B/C from the flavor system.
    const overrideLetters = Object.keys(overrides).filter(k => /^[A-F]$/.test(k)).sort();
    const letters = overrideLetters.length > 0 ? overrideLetters : ['A', 'B', 'C'];
    const effectiveCity = overrides.city || cityName;
    return letters.map(letter => {
      const o = overrides[letter] || {};
      const path = o.path || null;
      const navigationPath = o.navigationPath || null;
      const mapsUrl = ((navigationPath || path) && gmapsPath(navigationPath || path, effectiveCity)) || gmaps(address + ', ' + cityName);
      const fLetter = LETTER_FLAVOR_CYCLE[letter] || 'A';
      return {
        id: centerId + '-' + letter.toLowerCase(),
        label: tri('Route ' + letter, 'Route ' + letter, 'Itinéraire ' + letter),
        focus: f[fLetter].focus,
        difficulty: diffMap[letter],
        distanceKm: o.distanceKm != null ? o.distanceKm : variance(centerId, letter, base[letter].dist, base[letter].distSpread),
        durationMin: o.durationMin != null ? o.durationMin : variance(centerId, letter, base[letter].dur, base[letter].durSpread),
        image: fLetter,
        imageUrl: o.imageUrl || null,
        tags: f[fLetter].tags,
        notes: f[fLetter].notes,
        path: path,
        navigationPath: navigationPath,
        cityHint: effectiveCity,
        googleMapsUrl: mapsUrl
      };
    });
  }

  function makeCenter(id, nameNl, nameEn, nameFr, operator, address, phone) {
    return {
      id,
      name: tri(nameNl, nameEn, nameFr),
      operator, address, phone,
      routes: makeRoutes(id, address, nameNl)
    };
  }

  // ===================== Cities =====================
  const CITIES = [
    { id: 'antwerpen', name: tri('Antwerpen', 'Antwerp', 'Anvers'), region: 'flanders', province: tri('Antwerpen', 'Antwerp', 'Anvers'),
      centers: [makeCenter('antwerpen-deurne', 'Examencentrum Deurne', 'Deurne Exam Center', 'Centre d\'examen Deurne', 'GOCA', 'Doornstraat 146, 2610 Antwerpen', '+32 3 218 30 30')] },
    { id: 'kontich', name: tri('Kontich', 'Kontich', 'Kontich'), region: 'flanders', province: tri('Antwerpen', 'Antwerp', 'Anvers'),
      centers: [makeCenter('kontich-1', 'Examencentrum Kontich', 'Kontich Exam Center', 'Centre d\'examen Kontich', 'GOCA', 'Satenrozen 3, 2550 Kontich', '+32 3 450 92 80')] },
    { id: 'geel', name: tri('Geel', 'Geel', 'Geel'), region: 'flanders', province: tri('Antwerpen', 'Antwerp', 'Anvers'),
      centers: [makeCenter('geel-1', 'Examencentrum Geel', 'Geel Exam Center', 'Centre d\'examen Geel', 'GOCA', 'Antwerpseweg 51, 2440 Geel', '+32 14 58 65 50')] },
    { id: 'alken', name: tri('Alken', 'Alken', 'Alken'), region: 'flanders', province: tri('Limburg', 'Limburg', 'Limbourg'),
      centers: [makeCenter('alken-1', 'Examencentrum Alken', 'Alken Exam Center', 'Centre d\'examen Alken', 'GOCA', 'Stationsstraat 110, 3570 Alken', '+32 11 31 13 31')] },
    { id: 'bree', name: tri('Bree', 'Bree', 'Bree'), region: 'flanders', province: tri('Limburg', 'Limburg', 'Limbourg'),
      centers: [makeCenter('bree-1', 'Examencentrum Bree', 'Bree Exam Center', 'Centre d\'examen Bree', 'GOCA', 'Industrieterrein Kanaal-Noord, 3960 Bree', '+32 89 47 11 90')] },
    { id: 'brugge', name: tri('Brugge', 'Bruges', 'Bruges'), region: 'flanders', province: tri('West-Vlaanderen', 'West Flanders', 'Flandre-Occidentale'),
      centers: [makeCenter('brugge-1', 'Examencentrum Brugge', 'Bruges Exam Center', 'Centre d\'examen Bruges', 'GOCA', 'Pathoekeweg 11, 8000 Brugge', '+32 50 32 09 11')] },
    { id: 'oostende', name: tri('Oostende', 'Ostend', 'Ostende'), region: 'flanders', province: tri('West-Vlaanderen', 'West Flanders', 'Flandre-Occidentale'),
      centers: [makeCenter('oostende-1', 'Examencentrum Oostende', 'Ostend Exam Center', 'Centre d\'examen Ostende', 'GOCA', 'Schietbaanstraat 56, 8400 Oostende', '+32 59 70 75 41')] },
    { id: 'roeselare', name: tri('Roeselare', 'Roeselare', 'Roulers'), region: 'flanders', province: tri('West-Vlaanderen', 'West Flanders', 'Flandre-Occidentale'),
      centers: [makeCenter('roeselare-1', 'Examencentrum Roeselare', 'Roeselare Exam Center', 'Centre d\'examen Roulers', 'GOCA', 'Mandellaan 333, 8800 Roeselare', '+32 51 26 06 50')] },
    { id: 'wevelgem', name: tri('Wevelgem', 'Wevelgem', 'Wevelgem'), region: 'flanders', province: tri('West-Vlaanderen', 'West Flanders', 'Flandre-Occidentale'),
      centers: [makeCenter('wevelgem-1', 'Examencentrum Wevelgem', 'Wevelgem Exam Center', 'Centre d\'examen Wevelgem', 'GOCA', 'Luchthavenstraat 1, 8560 Wevelgem', '+32 56 36 12 90')] },
    { id: 'gent', name: tri('Gent', 'Ghent', 'Gand'), region: 'flanders', province: tri('Oost-Vlaanderen', 'East Flanders', 'Flandre-Orientale'),
      centers: [makeCenter('gent-sdw', 'Examencentrum Sint-Denijs-Westrem', 'Sint-Denijs-Westrem Exam Center', 'Centre d\'examen Sint-Denijs-Westrem', 'GOCA', 'Poortakkerstraat 127, 9051 Sint-Denijs-Westrem', '+32 9 220 75 51')] },
    { id: 'sint-niklaas', name: tri('Sint-Niklaas', 'Sint-Niklaas', 'Saint-Nicolas'), region: 'flanders', province: tri('Oost-Vlaanderen', 'East Flanders', 'Flandre-Orientale'),
      centers: [makeCenter('sintniklaas-1', 'Examencentrum Sint-Niklaas', 'Sint-Niklaas Exam Center', 'Centre d\'examen Saint-Nicolas', 'GOCA', 'Industriepark-Noord 27, 9100 Sint-Niklaas', '+32 3 776 16 16')] },
    { id: 'eeklo', name: tri('Eeklo', 'Eeklo', 'Eeklo'), region: 'flanders', province: tri('Oost-Vlaanderen', 'East Flanders', 'Flandre-Orientale'),
      centers: [makeCenter('eeklo-1', 'Examencentrum Eeklo', 'Eeklo Exam Center', 'Centre d\'examen Eeklo', 'GOCA', 'Nijverheidslaan 87, 9900 Eeklo', '+32 9 377 31 50')] },
    { id: 'erembodegem', name: tri('Erembodegem', 'Erembodegem', 'Erembodegem'), region: 'flanders', province: tri('Oost-Vlaanderen', 'East Flanders', 'Flandre-Orientale'),
      centers: [makeCenter('erembodegem-1', 'Examencentrum Erembodegem', 'Erembodegem Exam Center', 'Centre d\'examen Erembodegem', 'GOCA', 'Industrielaan 24, 9320 Erembodegem', '+32 53 70 81 28')] },
    { id: 'asse-mollem', name: tri('Asse-Mollem', 'Asse-Mollem', 'Asse-Mollem'), region: 'flanders', province: tri('Vlaams-Brabant', 'Flemish Brabant', 'Brabant flamand'),
      centers: [makeCenter('assemollem-1', 'Examencentrum Asse-Mollem', 'Asse-Mollem Exam Center', 'Centre d\'examen Asse-Mollem', 'GOCA', 'Assesteenweg 117, 1730 Asse', '+32 2 452 71 81')] },
    { id: 'heverlee', name: tri('Heverlee', 'Heverlee', 'Heverlee'), region: 'flanders', province: tri('Vlaams-Brabant', 'Flemish Brabant', 'Brabant flamand'),
      centers: [makeCenter('haasrode-1', 'Examencentrum Haasrode', 'Haasrode Exam Center', 'Centre d\'examen Haasrode', 'GOCA', 'Interleuvenlaan 64, 3001 Heverlee', '+32 16 39 89 89')] },
    { id: 'anderlecht', name: tri('Anderlecht', 'Anderlecht', 'Anderlecht'), region: 'brussels', province: tri('Brussel', 'Brussels', 'Bruxelles'),
      centers: [makeCenter('anderlecht-1', 'Examencentrum Anderlecht', 'Anderlecht Exam Center', 'Centre d\'examen Anderlecht', 'GOCA / SBAT', 'Industrielaan 22, 1070 Anderlecht', '+32 2 521 89 76')] },
    { id: 'schaerbeek', name: tri('Schaarbeek / Evere', 'Schaerbeek / Evere', 'Schaerbeek / Evere'), region: 'brussels', province: tri('Brussel', 'Brussels', 'Bruxelles'),
      centers: [makeCenter('schaerbeek-1', 'Examencentrum Schaarbeek', 'Schaerbeek Exam Center', 'Centre d\'examen Schaerbeek', 'GOCA / SBAT', 'Colonel Bourgstraat 118, 1140 Evere', '+32 2 736 89 19')] },
    { id: 'couillet', name: tri('Couillet / Charleroi', 'Couillet / Charleroi', 'Couillet / Charleroi'), region: 'wallonia', province: tri('Henegouwen', 'Hainaut', 'Hainaut'),
      centers: [makeCenter('couillet-1', 'Centre d\'examen Couillet', 'Couillet Exam Center', 'Centre d\'examen Couillet', 'AIBV', 'Route de Philippeville 207, 6010 Couillet', '+32 71 47 47 60')] },
    { id: 'braine-le-comte', name: tri('\'s Gravenbrakel', 'Braine-le-Comte', 'Braine-le-Comte'), region: 'wallonia', province: tri('Henegouwen', 'Hainaut', 'Hainaut'),
      centers: [makeCenter('braine-1', 'Centre d\'examen Braine-le-Comte', 'Braine-le-Comte Exam Center', 'Centre d\'examen Braine-le-Comte', 'AIBV', 'Rue de la Station 144, 7090 Braine-le-Comte', '+32 67 55 65 86')] },
    { id: 'mariembourg', name: tri('Mariembourg', 'Mariembourg', 'Mariembourg'), region: 'wallonia', province: tri('Namen', 'Namur', 'Namur'),
      centers: [makeCenter('mariembourg-1', 'Centre d\'examen Mariembourg', 'Mariembourg Exam Center', 'Centre d\'examen Mariembourg', 'AIBV', 'Rue de la Gare 11, 5660 Mariembourg', '+32 60 31 11 12')] },
    { id: 'arlon', name: tri('Aarlen', 'Arlon', 'Arlon'), region: 'wallonia', province: tri('Luxemburg', 'Luxembourg', 'Luxembourg'),
      centers: [makeCenter('arlon-1', 'Centre d\'examen Arlon', 'Arlon Exam Center', 'Centre d\'examen Arlon', 'AIBV', 'Zoning de Stockem, 6700 Arlon', '+32 63 22 11 91')] },
    { id: 'bastogne', name: tri('Bastenaken', 'Bastogne', 'Bastogne'), region: 'wallonia', province: tri('Luxemburg', 'Luxembourg', 'Luxembourg'),
      centers: [makeCenter('bastogne-1', 'Centre d\'examen Bastogne', 'Bastogne Exam Center', 'Centre d\'examen Bastogne', 'AIBV', 'Rue des Aubépines 7, 6600 Bastogne', '+32 61 21 50 50')] },
    { id: 'marche', name: tri('Marche-en-Famenne', 'Marche-en-Famenne', 'Marche-en-Famenne'), region: 'wallonia', province: tri('Luxemburg', 'Luxembourg', 'Luxembourg'),
      centers: [makeCenter('marche-1', 'Centre d\'examen Marche', 'Marche Exam Center', 'Centre d\'examen Marche', 'AIBV', 'Rue du Carmel 10, 6900 Marche-en-Famenne', '+32 84 32 16 56')] },
    { id: 'liege', name: tri('Luik', 'Liège', 'Liège'), region: 'wallonia', province: tri('Luik', 'Liège', 'Liège'),
      centers: [makeCenter('wandre-1', 'Centre d\'examen Wandre', 'Wandre Exam Center', 'Centre d\'examen Wandre', 'AIBV', 'Rue de Visé 416, 4020 Wandre', '+32 4 362 76 14')] },
    { id: 'namur', name: tri('Namen', 'Namur', 'Namur'), region: 'wallonia', province: tri('Namen', 'Namur', 'Namur'),
      centers: [makeCenter('suarlee-1', 'Centre d\'examen Suarlée', 'Suarlée Exam Center', 'Centre d\'examen Suarlée', 'AIBV', 'Chaussée de Nivelles 212, 5020 Suarlée', '+32 81 56 78 90')] },
    { id: 'tournai', name: tri('Doornik', 'Tournai', 'Tournai'), region: 'wallonia', province: tri('Henegouwen', 'Hainaut', 'Hainaut'),
      centers: [makeCenter('tournai-1', 'Centre d\'examen Tournai', 'Tournai Exam Center', 'Centre d\'examen Tournai', 'AIBV', 'Rue de la Terre à Briques 22, 7522 Tournai', '+32 69 88 26 60')] },
    { id: 'louvain-la-neuve', name: tri('Louvain-la-Neuve', 'Louvain-la-Neuve', 'Louvain-la-Neuve'), region: 'wallonia', province: tri('Waals-Brabant', 'Walloon Brabant', 'Brabant wallon'),
      centers: [makeCenter('lln-1', 'Centre d\'examen Louvain-la-Neuve', 'Louvain-la-Neuve Exam Center', 'Centre d\'examen Louvain-la-Neuve', 'AIBV', 'Rue de Rodeuhaie 1, 1348 Louvain-la-Neuve', '+32 10 45 19 60')] },
    { id: 'eupen', name: tri('Eupen / Lontzen', 'Eupen / Lontzen', 'Eupen / Lontzen'), region: 'wallonia', province: tri('Luik', 'Liège', 'Liège'),
      centers: [makeCenter('eupen-1', 'Centre d\'examen Eupen', 'Eupen Exam Center', 'Centre d\'examen Eupen', 'AIBV', 'Aachener Straße 70, 4710 Lontzen', '+32 87 56 02 02')] },
    { id: 'lobbes', name: tri('Lobbes', 'Lobbes', 'Lobbes'), region: 'wallonia', province: tri('Henegouwen', 'Hainaut', 'Hainaut'),
      centers: [makeCenter('lobbes-1', 'Centre d\'examen Lobbes', 'Lobbes Exam Center', 'Centre d\'examen Lobbes', 'AIBV', 'Rue de la Station 30, 6540 Lobbes', '+32 71 59 53 38')] },
    { id: 'tihange', name: tri('Tihange / Hoei', 'Tihange / Huy', 'Tihange / Huy'), region: 'wallonia', province: tri('Luik', 'Liège', 'Liège'),
      centers: [makeCenter('tihange-1', 'Centre d\'examen Tihange', 'Tihange Exam Center', 'Centre d\'examen Tihange', 'AIBV', 'Chaussée de Tihange 75, 4500 Huy', '+32 85 21 11 15')] },
    { id: 'cuesmes', name: tri('Cuesmes', 'Cuesmes', 'Cuesmes'), region: 'wallonia', province: tri('Henegouwen', 'Hainaut', 'Hainaut'),
      centers: [makeCenter('cuesmes-1', 'Centre d\'examen Cuesmes', 'Cuesmes Exam Center', 'Centre d\'examen Cuesmes', 'AIBV', 'Rue Ferrer 105, 7033 Cuesmes', '+32 65 31 33 70')] }
  ];

  // ===================== Expose =====================
  window.EXAM_ROUTE_DATA = { cities: CITIES };
})();
