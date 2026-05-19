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
  function normalizeCoordInput(s) {
    return String(s).trim()
      .replace(/^(-?\d)\s+(\d+),(-?\d+),(\d+)$/, '$1.$2,$3.$4')
      .replace(/^(-?\d)\s+(\d+),(-?\d+\.\d+)$/, '$1.$2,$3')
      .replace(/^(-?\d+\.\d+),(-?\d+),\.(\d+)$/, '$1,$2.$3')
      .replace(/^(-?\d+\.\d+)\.(-?\d+)\s+(\d+)$/, '$1,$2.$3')
      .replace(/^(-?\d+),(\d+),(-?\d+\.\d+)$/, '$1.$2,$3')
      .replace(/^(-?\d+\.\d+),(-?\d+),(\d+)$/, '$1,$2.$3')
      .replace(/,\s*(-?\d+)\.\s*(\d+)$/, ',$1.$2')
      .replace(/%$/, '');
  }
  function asCoord(s) {
    const normalized = normalizeCoordInput(s);
    const m = /^(-?\d+\.\d+),(-?\d+\.\d+)$/.exec(normalized);
    if (!m) return null;
    return m[2] + ',' + m[1];
  }
  function normalizeRoadCodeInput(s) {
    const normalized = String(s).trim()
      .replace(/[¢%]$/g, '')
      .replace(/\s+/g, '')
      .toUpperCase();
    return /^(?:[ABENR]\.?\d{1,4}(?:\.\d{1,4})*[A-Z]?)$/.test(normalized) ? normalized : null;
  }
  function isRoadCodeStop(s) {
    return !!normalizeRoadCodeInput(s);
  }
  function isQualifiedStop(s) {
    const trimmed = String(s).trim();
    return /\b\d{4}\b/.test(trimmed) || /,\s*(?:belgium|belgie|belgië|belgique)$/i.test(trimmed) || /,\s*[A-Za-zÀ-ÿ' -]+$/.test(trimmed);
  }
  function gmapsPath(path, cityName) {
    if (!path || path.length < 2) return null;
    const segments = path.map(p => {
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
    'brakel-1': 'flemish-rural',
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

  const ROUTE_IMAGE_PREFIXES = {
    'alken-1': 'Alken',
    'arlon-1': 'Arlon',
    'assemollem-1': 'AsseMollem',
    'bastogne-1': 'Bastogne',
    'braine-1': 'Braine-le-Comter-',
    'brakel-1': 'Brakel',
    'bree-1': 'Bree',
    'brugge-1': 'Brugge',
    'couillet-1': 'Couillet',
    'cuesmes-1': 'Cuesmes',
    'antwerpen-deurne': 'Deurne',
    'eeklo-1': 'Eeklo',
    'erembodegem-1': 'Erembodegem',
    'eupen-1': 'Eupen',
    'geel-1': 'Geel',
    'gent-sdw': 'Gent',
    'haasrode-1': 'Haasrode',
    'kontich-1': 'Kontich',
    'lobbes-1': 'Lobbes',
    'lln-1': 'Louvain',
    'marche-1': 'Marche',
    'mariembourg-1': 'Mariembourg',
    'oostende-1': 'Ostend',
    'roeselare-1': 'Roeselare',
    'sintniklaas-1': 'Sint-Niklaas',
    'suarlee-1': 'Suarlee',
    'tihange-1': 'Tihange',
    'tournai-1': 'Tournai',
    'wandre-1': 'Wandre',
    'wevelgem-1': 'Wevelgem'
  };

  // ===================== Per-center route overrides =====================
  // Add an entry here when you want to define the exact street-by-street
  // path for a center's routes. Each route override may include:
  //   path:        [streets...] — first and last are origin/destination
  //   distanceKm:  number
  //   durationMin: number
  //   imageUrl:    string — image displayed on the route card
  const ROUTE_OVERRIDES = {
    "alken-1": {
      city: "Alken",
      A: { path: ["Pickardstraat", "Stationsstraat", "N80", "Luikersteenweg", "Zomerstraat", "5.345671,50.917724", "Sint-Martinusplein", "de Geloesplein", "Prins-Bisschopssingel", "Sint-Truidersteenweg", "Pickardstraat"], imageUrl: "assets/AlkenrouteA.png" },
      B: { path: ["Pickardstraat", "Meerdegatstraat", "Steenweg", "Trekschurenstraat", "Kliniekstraat", "Prins-Bisschopssingel", "Danielstraat", "Oude Luikerbaan", "Kruisherenlaan", "Slagerslaan", "Boerenkrijgsingel", "N80", "Pickardstraat"], imageUrl: "assets/AlkenrouteB.png" },
      C: { path: ["Pickardstraat", "Kolmenstraat", "N80", "Sint-Truidersteenweg", "Vorststraat", "Paenhuisstraat", "Pastorijstraat", "Graaf de Brigodestraat", "Lindenhofstraat", "Beukenhoflaan", "Sint-Truidersteenweg", "Stationsstraat", "Pickardstraat"], imageUrl: "assets/AlkenrouteC.png" },
      D: { path: ["Pickardstraat", "Papenakkerstraat", "Rode-Kruisstraat", "Lindenhofstraat", "Kapelhofstraat", "Sint-Truidersteenweg", "N80", "Pickardstraat"], imageUrl: "assets/AlkenrouteD.png" },
      E: { path: ["Pickardstraat", "Jardinstraat", "N80", "Notelarenstraat", "Jagersstraat", "Sint-Hubertusplein", "Boerenkrijgsingel", "Sint-Truidersteenweg", "Pickardstraat"], imageUrl: "assets/AlkenrouteE.png" },
      F: { path: ["Pickardstraat", "N80", "Sint-Truidersteenweg", "Elzenstraat", "Abelenstraat", "Boomkensstraat", "Boomkensstraat", "Kruisherenlaan", "Sint-Hubertusplein", "Kramerslaan", "Slagerslaan", "Boerenkrijgsingel", "Sint-Truidersteenweg", "Kolmenstraat"], imageUrl: "assets/AlkenrouteF.png" }
    },

    "arlon-1": {
      city: "Arlon",
      A: { path: ["Rue Claude Berg", "E411", "E25", "5.778682,49.672546", "Rue de la Posterie", "Rue de Neufchateau", "Rue de Neufchateau", "Rue de Viville", "Rue des Faubourgs", "Rue Leon Castilhon", "Rue Zenobe Gramme", "Rue Zenobe Gramme", "Rue de Toernich", "Rue de Toernich", "Rue de Sesselich", "Rue du General Jourdan", "N81", "Rue Claude Berg"], imageUrl: "assets/ArlonrouteA.png" },
      B: { path: ["Rue Claude Berg", "Avenue de Longwy", "Chemin de Clairefontaine", "Chemin des Espagnols", "Avenue de Mersch", "Rue Paul Reuter", "Avenue de la Gare", "Rue Francq", "Rue Francq", "Square Albert-1er", "Rue Jean Koch", "Place des Fusilles", "Place de l'Yser", "Rue de Toernich", "Rue de Toernich", "Rue de la Gaume", "Rue du General Jourdan", "Route de Longwy", "N81", "Rue Claude Berg"], imageUrl: "assets/ArlonrouteB.png" },
      C: { path: ["Rue Claude Berg", "5.820002,49.652824", "Rue du General Jourdan", "Rue de Sesselich", "N817", "Avenue Jean-Baptiste Nothomb", "Square Albert-1er", "Rue Saint-Jean", "Rue Paul Reuter", "Place des Chasseurs Ardennais", "Rue de la Caserne", "Rue des Martyrs", "Square Albert-1er", "Rue des Martyrs", "Rue de Bastogne", "N4", "Avenue de Longwy", "Avenue de Longwy", "5.820504,49.65278", "Rue Claude Berg"], imageUrl: "assets/ArlonrouteC.png" },
      D: { path: ["Rue Claude Berg", "5.820002,49.652824", "Avenue de Longwy", "Avenue du General Patton", "Rue de la Semois", "Rue Zenobe Gramme", "Rue Leon Castilhon", "Rue de Neufchateau", "Rue de Neufchateau", "Rue de Bastogne", "Rue des Melezes", "N4", "Avenue de Longwy", "Rue des Deportes", "Avenue Victor Tesch", "Avenue du General Patton", "Avenue du General Patton", "Route de Longwy", "5.820504,49.65278", "Rue Claude Berg"], imageUrl: "assets/ArlonrouteD.png" },
      E: { path: ["Rue Claude Berg", "Avenue de Longwy", "Rue des Deportes", "Rue de la Synagogue", "Rue de la Caserne", "Rue Nicolas Berger", "Rue de Viville", "Avenue du Galgenberg", "Avenue du Galgenberg", "Avenue du Galgenberg", "Rue de Neufchateau", "E25", "E25", "E411", "N81", "Rue Claude Berg"], imageUrl: "assets/ArlonrouteE.png" },
      F: { path: ["Rue Claude Berg", "Avenue de Longwy", "Avenue du General Patton", "N817", "Rue des Deportes", "Avenue de Longwy", "N4", "Rue de Bastogne", "Rue Sainte-Croix", "Rue du Moulin Lampach", "Avenue du Galgenberg", "Rue de Neufchateau", "Rue des Martyrs", "Rue Joseph Netzer", "Rue Joseph Netzer", "Avenue du General Patton", "Avenue de Longwy", "N81", "Rue Claude Berg"], imageUrl: "assets/ArlonrouteF.png" }
    },

    "assemollem-1": {
      city: "Asse",
      A: { path: ["Z. 5 Mollem", "Velm", "Kouter", "Schermershoek", "Ichelgemstraat", "Mieregemstraat", "Slagmolenlaan", "Reedijk", "Dooren", "Z. 5 Mollem"], imageUrl: "assets/AsseMollemrouteA.png" },
      B: { path: ["Z. 5 Mollem", "Dorpstraat", "Brussegemplein", "Brussegemkerkstraat", "Nieuwelaan", "Vollickstraat", "Kasteelstraat", "Kasteelstraat", "Brusselsesteenweg", "Hennekenmolen", "Ganzenbos", "Z. 5 Mollem"], imageUrl: "assets/AsseMollemrouteB.png" },
      C: { path: ["Z. 5 Mollem", "Vaal", "Lindelaan", "Rozelaarstraat", "Lindendries", "Stevensveld", "Heilig Hartlaan", "Ganzenbos", "Z. 5 Mollem"], imageUrl: "assets/AsseMollemrouteC.png" },
      D: { path: ["Z. 5 Mollem", "Kalkoven", "Koningin Astridstraat", "Koensborre", "Putberg", "Heedstraat", "Keierberg", "Muurveld", "Kattestraat", "Gemeenteplein", "Z. 5 Mollem"], imageUrl: "assets/AsseMollemrouteD.png" },
      E: { path: ["Z. 5 Mollem", "Putberg", "Kapellestraat", "Lepelstraat", "Heuvelstraat", "Groenstraat", "Gentsesteenweg", "Kelestraat", "Dendermondsesteenweg", "Z. 5 Mollem"], imageUrl: "assets/AsseMollemrouteE.png" },
      F: { path: ["Z. 5 Mollem", "Mieregemstraat", "Slagmolenlaan", "Vesten", "Stationsstraat", "Peperstraat", "Spiegellaan", "August De Boeckstraat", "Brusselsesteenweg", "Z. 5 Mollem"], navigationPath: ["Z. 5 Mollem, 1730 Asse", "Mieregemstraat, 1730 Asse", "Slagmolenlaan, 1730 Asse", "Vesten 40, 1785 Merchtem", "Stationsstraat, 1785 Merchtem", "Peperstraat, 1785 Merchtem", "Spiegellaan, 1785 Merchtem", "August De Boeckstraat, 1785 Merchtem", "Brusselsesteenweg, 1785 Merchtem", "Z. 5 Mollem, 1730 Asse"], imageUrl: "assets/AsseMollemrouteF.png" }
    },

    "bastogne-1": {
      city: "Bastogne",
      A: { path: ["Rue du Marche Couvert", "Rue de la Fagne d'Hi", "Rue des Abattoirs", "Rue du Fortin", "5.69966,49.990853", "Avenue Olivier", "Chemin de Renval", "Route de Marche", "N4", "Rue du Marche Couvert"], imageUrl: "assets/BastognerouteA.png" },
      B: { path: ["Rue du Marche Couvert", "Rue de la Fagne d'Hi", "Rue du Fortin", "Rue des Tanneurs", "Place General Mac-Auliffe", "Rue des Jardins", "Rue des Quatre-Bras", "Rue Lejeune", "Rue de l'American Legion", "Rue de la Californie", "Rue de la Chapelle", "Chaussee d'Arlon", "Chaussee d'Arlon", "N4", "Rue du Marche Couvert", "Rue du Marche Couvert"], imageUrl: "assets/BastognerouteB.png" },
      C: { path: ["Rue du Marche Couvert", "5.692905,49.977639", "5.670981,49.969103", "E25", "E25", "A.026.204", "Chaussee Romaine", "Rue de la Petite Bovire", "Rue de la Petite Bovire", "Rue des Genets", "Rue des Genets", "Route de Marche", "Rue de Neufchateau", "Rue de Neufchateau", "Rue du Marche Couvert", "Rue du Marche Couvert"], imageUrl: "assets/BastognerouteC.png" },
      D: { path: ["Rue du Marche Couvert", "Rue du Vieux-Moulin", "Rue du Vivier", "Rue Jean-Beck", "Rue des Remparts", "Rue de Musy", "Rue de Neufchateau", "Rue de l'Arbre", "Rue du Marche Couvert"], imageUrl: "assets/BastognerouteD.png" },
      E: { path: ["Rue du Marche Couvert", "N854", "Rue Pierre Thomas", "Rue Pierre Thomas", "Rue du Vivier", "Rue de la Citadelle", "Chaussee d'Arlon", "Rue du Marche Couvert"], imageUrl: "assets/BastognerouteE.png" },
      F: { path: ["Rue du Marche Couvert", "Porte-de-Treves", "Rue Pierre Thomas", "Rue du 1er d'Artillerie", "Rue de La-Roche", "Route de Marche", "N4", "Rue du Marche Couvert"], imageUrl: "assets/BastognerouteF.png" }
    },

    "braine-1": {
      city: "Braine-le-Comte",
      A: { path: ["Avenue du Marouset", "Avenue du Marouset", "Rue Emile Heuchon", "Rue de la Station", "Rue de Bruxelles", "Place des Postes", "Rue de l'Ecole Normale", "Rue Adolphe Gillis", "Rue Hector Denis", "Place Rene Branquart", "Rue Emile Heuchon", "Avenue du Marouset"], imageUrl: "assets/Braine-le-Comter-routeA.png" },
      B: { path: ["Avenue du Marouset", "Avenue de la Houssiere", "Avenue de la Houssiere", "Rue Emile Heuchon", "Rue du Onze Novembre", "Rue d'Ecaussinnes", "Avenue Alix de Namur", "Chaussee de Mons", "Rue de Mons", "Grand Place", "Rue du Viaduc", "Chemin de Feluy", "Avenue du Marouset"], imageUrl: "assets/Braine-le-Comter-routeB.png" },
      C: { path: ["Avenue du Marouset", "Chemin des Dames", "Chemin des Dames", "Chemin des Dames", "Chemin des Dames", "Chemin des Dames", "Chemin du Chevauchoire de Binche", "Chemin du Chevauchoire de Binche", "Rue des Freres Dulait", "Rue des Freres Dulait", "Rue du 11 Novembre", "Place Rene Branquart", "Rue de la Station", "Rue Rey Aine", "Rue de la Brainette", "Rue Edouard Etienne", "Rue du Viaduc", "Chemin de Feluy", "Avenue du Marouset", "Avenue du Marouset"], imageUrl: "assets/Braine-le-Comter-routeC.png" },
      D: { path: ["Avenue du Marouset", "Rue Edouard Etienne", "Rue Vieille Chaussee", "Rue de l'Enseignement", "Rue Emile Heuchon", "Avenue du Marouset"], imageUrl: "assets/Braine-le-Comter-routeD.png" },
      E: { path: ["Avenue du Marouset", "Rue de la Croix Huart", "Rue des Etangs", "Rue du Nord", "Rue Laterale", "Rue Emile Heuchon", "Rue Adolphe Gillis", "Rue de l'Ecole Normale", "Rue de l'Enseignement", "Rue de Mons", "Chaussee de Mons", "Avenue Alix de Namur", "Avenue Alix de Namur", "Rue d'Ecaussinnes", "Chemin du Pont", "Chemin du Chevauchoire de Binche", "Chemin du Baudriquin", "Chemin du Baudriquin", "Avenue du Marouset", "Avenue du Marouset"], imageUrl: "assets/Braine-le-Comter-routeE.png" },
      F: { path: ["Avenue du Marouset", "Avenue du Marouset", "Rue du Viaduc", "Rue des Digues", "Rue de Bruxelles", "Place des Postes", "Rue Charles Mahieu", "Rue de Mons", "Rue d'Ecaussinnes", "Chaussee d'Ecaussinnes", "Chemin du Pont", "Rue Neuve", "Rue Hector Denis", "Rue de la Station", "Rue Rey Aine", "N533", "Rue de la Croix Huart", "Rue Chapelle a fourmis", "Avenue de la Houssiere", "Avenue de la Houssiere"], imageUrl: "assets/Braine-le-Comter-routeF.png" }
    },

    "bree-1": {
      city: "Bree",
      A: { path: ["Nieshofstraat", "Damburgstraat", "Breeérweg", "Kloosterstraat", "Egelstraat", "Kerkhofstraat", "Nieshofstraat Bohplt ( § JE", "4 J - . \\ ~ ? ; tlh"], displayPath: ["Nieshofstraat", "Damburgstraat", "Breeërweg", "Kloosterstraat", "Egelstraat", "Kerkhofstraat", "Nieshofstraat"], navigationPath: ["Nieshofstraat, 3960 Bree", "Damburgstraat, 3960 Bree", "Breeërweg, 3960 Bree", "Kloosterstraat, 3960 Bree", "Egelstraat, 3960 Bree", "Kerkhofstraat, 3960 Bree", "Nieshofstraat, 3960 Bree"] },
      B: { path: ["Nieshofstraat", "Bormanstraat", "Kraegshofstraat", "Bocholterkiezel", "Kaulillerweg", "Hoogstraat", "Dorpsstraal", "Kapelstraat", "Sint-Jobstraat", "Brugstraat", "Sportlaan", "Nieshofstraat"] },
      C: { path: ["Nieshofstraat", "Meeuwerkiezel", "Boneputstraat", "Gruitroderstraat", "Opitterkiezel", "Panhovenstraat", "Maalbosstraat", "Bruglaan", "Sportlaan", "Barrierstraat", "Barrierstraat", "Nieshofstraat"] },
      D: { path: ["Nieshofstraat", "Kloosterpoort", "Gerdingerpoort", "Stift", "Tolelkstraat", "Rode Kruislaan", "Barrierstraat", "Nieshofstraat ( Ge Hnaer - oi \\ i y \\ \\ Breel” : / PE", "RR BY ON NT wrkenberg"] },
      E: { path: ["Nieshofstraat", "Bocholterkiezel", "Ter Rivierenwal", "Malta", "Millenstraat", "Maalbosstraat", "Rorenweg", "Nieshofstraat 2 / 3", "J eck x / id Fy J 4", "be dinges", "i a r / \\/ EN Vv { Bree Uta Cm", "PuprderoRew - TS rt - , mm"], displayPath: ["Nieshofstraat", "Bocholterkiezel", "Ter Rivierenwal", "Malta", "Millenstraat", "Maalbosstraat", "Rorenweg", "Nieshofstraat"], navigationPath: ["Nieshofstraat, 3960 Bree", "Bocholterkiezel, 3960 Bree", "Ter Rivierenwal, 3960 Bree", "Malta, 3960 Bree", "Millenstraat, 3960 Bree", "Maalbosstraat, 3960 Bree", "Rorenweg, 3960 Bree", "Nieshofstraat, 3960 Bree"] },
      F: { path: ["Nieshofstraat", "Bocholterkiezel", "Schutterijstraat", "Vrijheidslaan", "Sint-Jobstraat", "Stadsplein", "Witte Torenwal", "Nieuwstadpoort", "Peerderbaan", "Nieshofstraat"] }
    },

    "couillet-1": {
      city: "Couillet",
      A: { path: ["Rue du Lion Belge", "Rue Emile Vandervelde", "Route de Chatelet", "Rue de 'Energie", "Rue de la Babotterie", "Rue de la fombe", "Rue de la Tombe", "Rue du Lion Belge [NE . 8 py Couillet 2 “a", "J a _", "4 : eh oy"] },
      B: { path: ["Rue du Lion Belge", "Rue de la Babotterie", "Rue de la Grande Cheneviere", "Route de Philippeville", "Rue du Lion Belge Marcinelle pes", "J f Coulliet aut OF Fl - oF ~", ") irr J"] },
      C: { path: ["Rue du Lion Belge", "Rue des Fougéres", "Rue des Cayats", "Rue du Grand Pont", "Rue Jules Destrée", "Rue Jules Destrée", "Rue du Lion Belge i] j Pe", "os. Maranelle id \\& a - a"] },
      D: { path: ["Rue du Lion Belge", "Rue Pierre Baily", "Rue du Vieux Moulin", "Rue Sabatier", "Avenue de Philippeville", "Rue du Lion Belge i (50 Dampremy E83", "(# p, f ( ¢3 Charleroi / / V4 \\ ®) (", "(©) Marcime ls ’"] },
      E: { path: ["Rue du Lion Belge", "Route de Chatelet", "Grand'Rue", "Rue du Pays de Liege", "Grand'Rue", "Rue Brigade Piron", "Chaussee de Charleroi", "Rue aux Scrabilles", "Chaussée de Charleroi", "Rue du Déversoir", "Rue du Déyersoir", "Rue du Déversoir", "Rue du Lion Belge Mar cined le \\ +0 \" Song Eh J", "~ Be, p", "Ne” 2 J Y S", "at?” (ws)"] },
      F: { path: ["Rue du Lion Belge", "Rue Emile Vandervelde", "Route de Chatelet", "Rue de la Babotterie", "Rue de Nalinnes", "Rue de la Gare", "Rue des Trois Fontaines", "Avenue de la Cite Parc", "Rue des Trois Fontaines", "Rue des Cayats", "Rue André Vésale", "Rue de la Longue Haie", "Rue de Villers", "Rue Emile Vandervelde", "Rue du Lion Belge od"] }
    },

    "antwerpen-deurne": {
      city: "Deurne",
      A: { path: ["Santvoortbeeklaan", "Straalstraat", "Metropoolstraat", "Toekomstlaan", "Deuzeldlaan", "Stanislas Meeuslei", "Winkelstap", "Bredabaan", "Burgemeester Gabriel Theunisbrug", "Santvoortbeeklaan 4", "4 i Schoten of"], navigationPath: ["Santvoortbeeklaan 4, 2100 Antwerpen", "Straalstraat, 2170 Antwerpen", "Metropoolstraat, 2170 Antwerpen", "Toekomstlaan, 2170 Antwerpen", "Deuzeldlaan, 2900 Schoten", "Stanislas Meeuslei, 2900 Schoten", "Winkelstap, 2900 Schoten", "Bredabaan 855, 2170 Antwerpen", "Burgemeester Gabriel Theunisbrug, 2170 Antwerpen", "Santvoortbeeklaan 4, 2100 Antwerpen"] },
      B: { path: ["Santvoortbeeklaan", "Deurnsebaan", "Eethuisstraat", "Secretaris Meyerlei", "Bredabaan", "Churchilllaan", "Verbertstraat", "Kasteeldreef", "Braamstraat", "Santvoortbeeklaan"], navigationPath: ["Santvoortbeeklaan 4, 2100 Antwerpen", "Deurnsebaan, 2170 Antwerpen", "Eethuisstraat, 2900 Schoten", "Secretaris Meyerlei, 2900 Schoten", "Bredabaan 967, 2900 Schoten", "Churchilllaan, 2900 Schoten", "Verbertstraat, 2900 Schoten", "Kasteeldreef, 2900 Schoten", "Braamstraat, 2900 Schoten", "Santvoortbeeklaan 4, 2100 Antwerpen"] },
      C: { path: ["Santvoortbeeklaan", "Confortalei", "Ter Heydelaan", "Mattheus Corvensstraat", "Boshovestraat", "Turnhoutsebaan", "Ruggeveldlaan", "Schotensesteenweg", "Santvoortbeeklaan"], navigationPath: ["Santvoortbeeklaan 4, 2100 Antwerpen", "Confortalei, 2100 Antwerpen", "Ter Heydelaan, 2100 Antwerpen", "Mattheus Corvensstraat, 2100 Antwerpen", "Boshovestraat, 2100 Antwerpen", "Turnhoutsebaan, 2100 Antwerpen", "Ruggeveldlaan, 2100 Antwerpen", "Schotensesteenweg, 2100 Antwerpen", "Santvoortbeeklaan 4, 2100 Antwerpen"] },
      D: { path: ["Santvoortbeeklaan", "Bisschoppenhoflaan", "Ten Eekhovelei", "Ten Eekhovelei", "Ter Heydelaan", "Ter Rivierenlaan", "Boshovestraat", "Leeuwlantstraat", "Venneborglaan", "Alfons Schneiderlaan", "Gallifortlei", "Oude Bosuilbaan", "Santvoortbeeklaan"], navigationPath: ["Santvoortbeeklaan 4, 2100 Antwerpen", "Bisschoppenhoflaan, 2100 Antwerpen", "Ten Eekhovelei, 2100 Antwerpen", "Ter Heydelaan, 2100 Antwerpen", "Ter Rivierenlaan, 2100 Antwerpen", "Boshovestraat, 2100 Antwerpen", "Leeuwlantstraat, 2100 Antwerpen", "Venneborglaan, 2100 Antwerpen", "Alfons Schneiderlaan, 2100 Antwerpen", "Gallifortlei, 2100 Antwerpen", "Oude Bosuilbaan, 2100 Antwerpen", "Santvoortbeeklaan 4, 2100 Antwerpen"] },
      E: { path: ["Santvoortbeeklaan", "Haoutlaan", "Dorenboslaan", "Brouwerslaan", "Ridder Gustaaf van Havrelaan", "Fortveldstraat", "Santvoortbeeklaan"], navigationPath: ["Santvoortbeeklaan 4, 2100 Antwerpen", "Houtlaan, 2900 Schoten", "Dorenboslaan, 2110 Wijnegem", "Brouwerslaan, 2110 Wijnegem", "Ridder Gustaaf van Havrelaan, 2110 Wijnegem", "Fortveldstraat, 2900 Schoten", "Santvoortbeeklaan 4, 2100 Antwerpen"] },
      F: { path: ["Santvoortbeeklaan", "Middelmolenlaan", "Ganzenweg", "Vuurkruisenlaan", "Zandstraat", "Schoolstraat", "Koolsveldlaan", "Dorenboslaan", "Houtlaan", "Santvoortbeeklaan"], navigationPath: ["Santvoortbeeklaan 4, 2100 Antwerpen", "Middelmolenlaan, 2100 Antwerpen", "Ganzenweg, 2100 Antwerpen", "Vuurkruisenlaan, 2100 Antwerpen", "Zandstraat, 2100 Antwerpen", "Schoolstraat, 2100 Antwerpen", "Koolsveldlaan, 2100 Antwerpen", "Dorenboslaan, 2110 Wijnegem", "Houtlaan, 2900 Schoten", "Santvoortbeeklaan 4, 2100 Antwerpen"] }
    },

    "erembodegem-1": {
      city: "Erembodegem",
      A: { path: ["Industrielaan", "Hertstraat", "Kortestraat", "Regentiestraat", "Langestraat", "Kattestraat", "Kerkstraat", "Industrielaan"] },
      B: { path: ["Industrielaan", "Churchillsteenweqg", "Eigenstraat", "Priester Daenslaan", "Beukenlaan", "Beoglaan", "Steenweg", "Industrielaan"] },
      C: { path: ["Industrielaan", "Guido Gezellestraat", "Dwarsstraat", "Alfons De Cockstraat", "Middenstraat", "Steenweg", "lddergemstraat * N45", "Industrielaan !"] },
      D: { path: ["Industrielaan", "Keppestraat", "Erembodegem-Dorp", "Van de Vijverstraat", "Brusselse steenweg", "Parklaan", "Industrielaan"] },
      E: { path: ["Industrielaan", "Churchillsteenweg", "Geraardsbergsesteenweq", "Schoolstraat", "Schoolstraat", "Nieuwerkerken-Dorp", "Kwalestraat", "4.029762,50.917803", "Industrielaan"] },
      F: { path: ["Industrielaan", "Hugo Lefévrestraat", "Eikstraat", "Houtmarkt", "Korte Zoutstraat", "Leo de Béthunelaan", "Ninovesteenweq", "Industrielaan"] }
    },

    "eupen-1": {
      city: "Eupen",
      A: { path: ["Campus Strasse", "Ernest Solvay Strasse", "Jean-Jacques Deny Strasse", "Gemehret", "Gemehret", "Noretherstralle", "Aachener Strasse", "HockstraRe", "JudenstralRe", "Stockem", "Stockem", "Herbesthaler Strasse", "Rue Mitoyenne", "Jean-Jacques Dony Strasse", "Zénobe Gramme Strasse", "Campus Strasse"] },
      B: { path: ["Campus Strasse", "Rue de Dison", "Quatre-Chemins", "Campus Strasse Welkenraedt EE FY Va A ¢ f a \\ y «* ef"] },
      C: { path: ["Campus Strasse", "Ernest Solvay Strasse", "Rue Mitoyenne", "5.889221,50.64535", "Rue du Pére Nicolas Hardy", "Quatre-Chemins", "Hoyoux", "Meuschemen", "Heggensbriick", "Heggensbriuck", "Rue des Francs", "Rue des Francs", "Rue des Bas-Fourneaux", "Rue du Minerai", "Industriestrale", "Rue Mitoyenne", "Jean-Jacques Dony Strasse", "Campus Strasse Nerelt Ds ps Ba a-ha", "HOCKem Fupen"] },
      D: { path: ["Campus Strasse", "Ernest Solvay Strasse", "Herbesthaler Strasse", "Hochstralle", "Buschbergerweg", "Scheidweg", "Schnellewindgasse", "Schnellewindgasse", "Heldgasse", "Nispert", "Schonefelderweg", "Schdnefelderweg", "Kaperberg", "Hookstralle", "Vervierser Strasse", "Herbesthaler Strasse", "Rue Mitoyenne", "Jean-Jacques Dony Strasse", "Campus Strasse"] },
      E: { path: ["Campus Strasse", "Ernest Solvay Strasse", "Jean-Jacques Dony Strasse", "Rue des Francs", "Chemin des Tilleuls", "Chemin des Tilleuls", "Levée de Limbourg", "Heggen", "Rue de Baelen", "Rue de Baelen", "Rue Langaumont", "Rue de Dison", "Rue de I'Eglise", "Boulevard Hector Grosjean", "Boulevard Hector Grosjean", "Boulevard Hector Grosjean", "Jean-Jacques Dony Strasse", "Campus Strasse wel ] (We? L % : SEN Herbestha BN NA"] },
      F: { path: ["Campus Strasse", "Ernest Solvay Strasse", "Neutralstralle", "NeutralstraRe", "Rue de I'Ecole", "Rue de I'Eglise", "Rue de Baelen", "Rue de Baelen", "Heggen", "Heggen", "Oeveren", "Rue du Thier", "Rue du Thier", "Rue Saint-Paul", "5.987846,50.636379", "Jean-Jacques Dony Strasse", "Campus Strasse"] }
    },

    "haasrode-1": {
      city: "Heverlee",
      A: { path: ["Ambachtenlaan", "Technologielaan", "Interleuvenlaan", "Geldenaaksebaan", "Blandenstraat", "Dassenstraat", "Korbeek-Losestraat", "Tiensesteenweqg", "Vlietstraat", "Brugstraat", "Geldenaaksevest", "Ambachtenlaan"] },
      B: { path: ["Ambachtenlaan", "Ambachtenlaan", "Kerspelstraat", "Leeuwerikenstraat", "Verbindingslaan", "Parkdallaan", "Pakenstraat", "Geldenaaksevest", "Tiensesteenweg", "4.722289,50.851372", "Ambachtenlaan"] },
      C: { path: ["Ambachtenlaan", "Tiensesteenweg", "Geldenaaksevest", "Henri Regastraat", "Andreas Vesaliusstraat", "Tiensestraat", "Naamsesteenweg", "Hertogstraat", "Hertogstraat", "Ambachtenlaan"] },
      D: { path: ["Ambachtenlaan", "Groenstraat", "Groenstraat", "Middelweg", "Middelweg", "Naamsesteenweg", "Tervuursevest", "Schapenstraat", "Parkstraat", "Ambachtenlaan"] },
      E: { path: ["Ambachtenlaan", "Kerspelstraat", "Armand Thierylaan", "Naamsevest", "Ambachtenlaan (Waa i Heverlee \\", "© NN % \\L"] },
      F: { path: ["Ambachtenlaan", "Geldenaaksebaan", "Pakenstraat", "Prins De Lignestraat", "Celestijnenlaan", "Geldenaaksebaan", "Hertogstraat", "Ambachtenlaan"] }
    },

    "kontich-1": {
      city: "Kontich",
      A: { path: ["Neerveld", "Duffelsesteenweq", "Duffelshoek", "Haakstuk", "Vekenveld", "Kapelstraat", "Hoge Akker", "Moederhoefstraat", "Kardinaal Cardijnlaan", "Duffelsesteenweqg", "Klokkestraat", "Neerveld"] },
      B: { path: ["Neerveld", "Mechelsesteenweqg", "Asterlaan", "Reepkenslei", "Mechelsesteenweg", "Witvrouwenveldstraat", "De Villermontstraat", "Duffelsesteenweg", "Neerveld"] },
      C: { path: ["Neerveld", "Singel", "Duffelsesteenweqg", "Koningin Astridlaan", "Ooststatiestraat", "Bautersemstraat", "Altenastraat", "Edegemsesteenweg", "Drabstraat", "Kruisschanslei", "Mechelsesteenweg", "Neerveld"] },
      D: { path: ["Neerveld", "Duffelsesteenweg", "Koningin Astridlaan", "Vredestraat", "Jan Frans Gellyncklaan", "Mechelsesteenweg", "Romeinse Put", "Edegemsesteenweg", "Helenaveldstraat", "Pluyseghemstraat", "Drabstraat", "Neerveld", "Neerveld"] },
      E: { path: ["Neerveld", "Neerveld", "Mechelsesteenweg", "Lijsterbolstraat", "Lijsterbolstraat", "Duffelsesteenweg", "Duffelsesteenweg", "Duffelsesteenweg", "Holle Weg", "Kauwlei", "Ooststatiestraat", "Koningin Astridlaan", "Neerveld"] },
      F: { path: ["Neerveld", "Antwerpsesteenweg", "Lentelei", "Kontichstraat", "Drabstraat", "Mechelsesteenweqg", "Neerveld"] }
    },

    "lobbes-1": {
      city: "Lobbes",
      A: { path: ["Rue de Binche", "Rue de Binche", "Rue de I'Abbaye", "Rue de Ia Grattiere", "Rue de Lobbes", "Route de Lobbes", "Avenue de Ragnies", "Rue de 'Abattoir", "Rue du Moustier", "Rue 't Serstevens", "Rue d'Anderlues", "Rue d'Anderlues", "Rue d'Anderlues", "Route d'Anderlues", "Rue d'Anderlues", "Rue Taille aux Chevaux", "Rue de la Chapelle aux Charmes", "Chemin Vert", "Rue des Viviers", "Rue de Binche"] },
      B: { path: ["Rue de Binche", "Rue des Viviers", "Rue des Viviers", "Rue des Viviers", "Rue des Quatre Bras", "Rue du Crombouly", "Rue d'Anderlues", "Rue d'Anderlues", "Rue d’Anderlues", "Rue des Nobles", "Grand'Rue", "Rue du Fosteau", "Rue du Fosteau", "Rue du Fosteau", "Rue du Fosteau", "Rue de Sartiau", "Rue de Sartiau", "Rue de la Grattiere", "Rue de [Abbaye", "Rue de Binche"] },
      C: { path: ["Rue de Binche", "Rue des Viviers", "Rue des Viviers", "N559 4.282219,50.385872", "4.295839,50.390118", "Rue Georges Marcelle", "Rue Joseph Wauters", "Rue du Vieux Cimetiere", "Rue du Chateau d'Eau", "Rue d'Ansuelle", "Rue du Pont", "Route des Fusillés", "Rue Notre-Dame de la Bonne Route", "Rue de Binche", "l'Eveque Anderiues \" Morz-SBint"] },
      D: { path: ["Rue de Binche", "Rue des Viviers", "Rue des Viviers", "N55%", "4.282219,50.385872", "4.295464,50.389965", "4.291916,50.40631", "Chaussée de Mons", "Rue du Marais", "Rue du Marais", "Rue du Macau", "Rue a Dettes", "Rue du Vanériau", "Route des Fusilles", "Route des Fusilles", "Rue des Hayettes", "Rue de Binche i"] },
      E: { path: ["Rue de Binche", "Rue de Binche", "Rue de 'Abbaye", "Rue de la Grattiére", "Rue de Lobbes", "Rue de Lobbes", "Route de Lobbes", "Rue d'Anderlues", "Rue d'Anderlues", "Rue d'Anderlues", "Rue d'Anderlues", "Rue des Waibes", "Rue de la Grosse Borne", "Rue du Crombouly", "Trou des Loups", "Trou des Loups", "Trou des Loups", "Rue des Viviers", "Rue de Binche OY. v cveq"] },
      F: { path: ["Rue de Binche", "Rue des Viviers", "Rue des Viviers", "Rue des Viviers", "Rue d'’Anderlues", "Chaussée de Thuin", "Cité Jardin du Fief", "Cité Jardin du Fief", "Impasse du Fief", "Chaussée de Thuin", "Chaussee de Charleroi", "Rue du Chateau", "Rue du Chateau", "Place du Vanériau", "Rue du Vaneriau", "Rue du Vaneéeriau", "Route des Fusilles", "Route des Fusilles", "Rue Notre-Dame de la Bonne Route", "Rue de Binche"] }
    },

    "lln-1": {
      city: "Louvain-la-Neuve",
      A: { path: ["Avenue Albert Einstein", "Rue du Bosquet", "Rue de Rodeuhaie", "Boulevard Baudouin Ter", "Avenue des Arts", "4.603653,50.663704", "Boulevard de Wallonie", "Avenue Albert Einstein (& - OttigniesiLouvain"] },
      B: { path: ["Avenue Albert Einstein", "Chemin du Cyclotron", "Rue de Rodeuhaie", "Anneau Central-Sud", "Boulevard du Sud", "Avenue des Arts", "Place du Plat Pays", "Boulevard Baudouin ler", "Avenue Albert Einstein"] },
      C: { path: ["Avenue Albert Einstein", "Avenue Albert Einstein", "N25 + N25", "4.6496456.50 662248", "E411 E411", "AQD4 464 -~ AQDA4 464", "Boulevard du Brabant Wallan", "Boulevard de Wallonie", "Boulevard de Wallonwe-Nord", "Anneau Central-Sud", "Boulevard du Sud", "Boulevard du Sud", "Boulavard Baudouln Ter", "Avenue Albert Einstein"] },
      D: { path: ["Avenue Albert Einstein", "Avenue Georges Lemaitre", "Boulevard Baudouin 1er", "Boulevard Baudouin 1er", "Boulevard du Sud", "Boulevard du Sud", "Boulevard du Nord", "Boulevard du Brabant Wallon", "A 004.465", "4.646709,50,.661922", "4 645759,50.660636", "4.634998,50.659218", "Avenue Albert Einstein Avenue Albert Einstein"] },
      E: { path: ["Avenue Albert Einstein", "Avenue Jean Etienne Lenoir", "Rue du Bosquet", "Rue du Bosquetl", "Chemin de Vieusart", "4 643485,50,681797", "Chemin du Relai", "Avenue de la Seigneurie", "Voie de a Freneraie", "Voie de la Freneraie", "Venelle du Bois de Saras", "Voie des Cuirassiers", "Chaussae de Wavrie", "4 627175,50.668576", "Avenue Albert Einstein"] },
      F: { path: ["Avenue Albert Einstein", "Boulevard Baudouin Ter", "Chaussée de Wavre", "Chaussée de Namur", "Chaussee de Namur", "Chaussée de Huy", "Chaussée de Huy", "4,655246,50.704112", "Rue de a Sarte", "Rue du Village", "Voie de la Freneraie", "Avenue Albert Einstein ut"] }
    },

    "marche-1": {
      city: "Marche-en-Famenne",
      A: { path: ["5.324704,50.220372", "Rue du Rarc Industriel", "Avenue de France", "Rue du Manoir", "Rue du Luxembourg", "Rue du Luxembourg", "Rue de Bastogne", "5 363569,50.212103 + NA4 * NA", "Rue André Feher", "Rue Saumont", "Chemin des Lucicles", "Rue Espinthe", "Contournement de Marche", "Contournement de Marche", "Rue du Pare Industriel", "5.324877.50.220242"] },
      B: { path: ["5.324704,50.220372", "Avenue de France", "Rue des Tanneurs", "Rempart des Jésuites", "Rue de Nérette", "Avenue de la Toison d'Or", "Avenue de France", "5.324877,50.220242"] },
      C: { path: ["5.324704,50,220372", "Rue du Parc Industriel", "Rue Saint-lsidore", "Rue Saint-Isidore", "Rue Saint-Isidore", "Rue du Carmel", "Rue de Marlida", "Rue du Vicinal", "Rue de I'Ancienne Poste", "Rue du Maquis", "Rue de la Carriére", "Rue de la Pierre Saint-Hubert", "Avenue de la Teison d'Or", "Avenue de la Toison d'Or", "Rue Neuve", "Place aux Foires", "Boulevard du Midi", "Avenue de France", "Rue du Parc Industriel", "5.324877,50.220242"] },
      D: { path: ["5.324704,50.220372", "Rue du Parc Industriel", "5.335891,50.22393%", "Bois Notre-Dame", "Rue de a Plovinate", "Paradis des Chevaux", "Route de Waillet", "Chaussée de Liége", "Contournement", "Contournement", "Rue André Feher", "Rue André Feher", "Rue Saumont", "Chemin des Lucioles", "Contournement de Marche", "Contournement de Marche", "Rue du Parc Industriel", "5.324877,50.220242"] },
      E: { path: ["5.324704,50.220372", "Rue du Commerce", "Rue du Luxembourg", "Chemin de Champlon", "Rue des Cerisiers", "Rue du Chéteau", "5.324877,50.220242"] },
      F: { path: ["5.324794,50.220292", "Rue du Saint-Esprit", "Rue du Luxembourg", "Rue Ameéricaine", "Chaussee de Liege", "Avenue de France", "5.324877,50.220242"] }
    },

    "mariembourg-1": {
      city: "Mariembourg",
      A: { path: ["Rue Duc Saint Simon", "Rue de I'Aurziére", "Rue Bassidaine", "Rue Pierre Bosseau", "Rue Général de Monge", "Rue Duc Saint Simen s S ph\" pL \\ Maremb ] 5 ; 2 &"] },
      B: { path: ["Rue Duc Saint Simon", "Chemin de Tromcourt", "Rue du Monument", "Rue Jean Barré", "Rue de Mariembourg", "Rue du Monument", "Rue du Monument", "Allée des Frénes", "Rue de la Motte", "Rue Alphonse Thomas", "Chemin de Senzeille", "Chemin de Tromcourt", "Rue Duc Saint Simon"] },
      C: { path: ["Rue Duc Saint Simon", "Rue Duc Saint Simeon 4.499568,50.102582", "Rue du Fraity", "Rue du Fraity", "Rue du Fraity", "Rue du Fraity", "Rue du Fraity", "Rue de la Bowe", "Rue Saint-Louis", "Place Marie de Hongrie", "Rue de France", "Chaussee de Philippeville", "Rue Duc Saint Simon ro Viroin H Frasnd )", "4 ! fob 120 Nisrhe Aublair Colne"] },
      D: { path: ["Rue Duc Saint Simon", "Chemin de Tromecourt", "N§", "Route Charlemagne", "Avenue de a Libération", "Rue des Pres Flauris", "Avenue de la Libération", "Rue de la Barriere", "Rue de la Loresse", "Rue de Boussu", "Rue du Hache!", "Rue du Perron", "Rue Alphonse Thomas", "Chemin de Senzeille", "Chemin de Tromcourt", "Rue Duc Saint Simon"] },
      E: { path: ["Rue Duc Saint Simon", "Chemin de Tremcourt", "4.483964,50.092842", "Rue de la Chavée", "Rue de la Chavée", "Rue Basse Carnet", "Rue Saint-Joseph", "Rue Lonque Haie", "4.491681,50.05589", "Carriere du Parrain", "Route de Pesche", "Route de Pesche", "Faubourg Saint-Germain", "Rue Neuve", "4.507861,50.097868", "Chaussee de Philippeville", "Rue Duc Saint Simon we \\ gr"] },
      F: { path: ["Rue Duc Saint Simon", "Chemin de Tromcourt", "Chaussee de Philippeville", "Rue de France", "Boulevard de Bryas", "Chaussée de Givet", "Rue du Petit Tienne", "4.51388,50.079457", "Rue Général de Monge", "Rue des Monts", "Rue des Monts", "Rue des Monts", "Rue de I'Adujoir", "4.507791,50.071828", "4.507861,50.097868", "Chaussée de Philippeville", "Rue Duc Saint Simon"] }
    },

    "oostende-1": {
      city: "Oostende",
      A: { path: ["Zandvoordestraat", "Kasteelstraat", "Zonnebloemlaan", "Zwanenlaan", "Kalkoenlaan", "Keignaertlaan", "Grintweg", "Gistelsesteenweqg", "Zandvoordestraat"] },
      B: { path: ["Zandvoordestraat", "Plantijnstraat", "Ringlaan", "August Vermeylenstraat", "Gouwelozestraat", "Beekstraat", "Ringlaan", "Zandvoordestraat"] },
      C: { path: ["Zandvoordestraat", "Ijslandstraat", "Stationsstraat", "Hofstedestraat", "Constant Permekelaan", "Plantenstraat", "Zandvoordestraat", "Zandvoordestraat"] },
      D: { path: ["Zandvoordestraat", "Zandvoordestraat", "Tweebruggenstraat", "Prins Albertlaan", "Staessenstraat", "Fritz Vinckelaan", "Sluizenstraat", "Esperantolaan", "Zandvoordestraat"] },
      E: { path: ["Zandvoordestraat", "Petunialaan", "Koolmeesstraat", "Grintweg", "Zwanenlaan", "Graanmolenstraat", "Kasteelstraat", "Zandvoordestraat"] },
      F: { path: ["Zandvoordestraat", "Vogelzangdreef", "Parklaan", "Frére-Orbanstraat", "Bosweg", "Zandveoordestraat", "Zandvoordestraat"] }
    },

    "roeselare-1": {
      city: "Roeselare",
      A: { path: ["Brugsesteenwegg", "Brugsesteenwegg", "Ncordlaan", "Adriaen Willaertstraat", "Hugo Verrieststraat", "Sint-Amandsstraat", "Beversesteenweg", "Wijnendalestraat", "Brugsesteenwegg"] },
      B: { path: ["Brugsesteenweg", "Spanjestraat", "Kaaistraat", "Kachtemsestraat", "Kolenkaai", "Trakelweqg", "Jules Lagaelaan", "Beversesteenweqg", "Brugsesteenwegg"] },
      C: { path: ["Brugsesteenwegg", "Noordlaan", "Oude Noordlaan", "Nachtegaalstraat", "Relgerstraat", "Biezenstraat", "Honzebroekstraat", "Gitsestraat", "Robaardstraat", "Brugsesteenweg"] },
      D: { path: ["Brugsesteenweg", "Koning Leopold lll-laan", "Mandellaan", "Mandeldreef", "Hammestraat", "Fabrieksstraat", "Vijverstraat", "Beverseaardeweqg", "Wijnendalestraat", "Brugsesteenwegg"] },
      E: { path: ["Brugsesteenweg", "Groenestraat", "Molenstraat", "Bruaggesteenweg"] },
      F: { path: ["Brugsesteenwegg", "Wijnendalestraat", "Onledegoedstraat", "Rijksweg", "Rijksweg", "Roeselaarsestraat", "Rozenstraat", "Marktplein", "Kortrijksestraat", "Beverensestraat", "Beversesteenweg", "Wijnendalestraat", "Brugsesteenweg"] }
    },

    "sintniklaas-1": {
      city: "Sint-Niklaas",
      A: { path: ["Oostjachtpark", "Industriepark-Noord", "Koningin Fabiolapark", "Hertjen", "Glycinenplein", "Breedstraat", "Azalealaan", "Magnolialaan", "Heidebaan", "Lange Rekstraat", "Van Landeghemstraat", "Passtraat", "Damstraat", "Houten Schoen", "Industriepark-Ncoord", "Oostjachtpark . ¢ \\ L- 1 rrr"] },
      B: { path: ["Oostjachtpark", "Hoge Heerweg", "Prins Alexanderlaan", "Hoogkamerstraat", "Sint-Amelbergalaan", "Frank Van Dyckelaan", "Philippe Saveryslaan", "Paswerkerslaan", "Tekenaarslaan", "Leiedam", "Doornstraat", "Hoogkamerstraat", "Houten Schoen", "Hoge Heerweg", "Oostjachtpark"] },
      C: { path: ["Oostjachtpark", "Hoogkamerstraat", "Kapelanielaan", "Hoogkamerstraat", "Schoolstraat", "Markt", "Wilfordkaai", "Kasteelstraat", "Brigade Pironstraat", "Fonteinstraat", "Sint-Jorisstraat", "Industriepark-Noord", "Oostjachtpark ®)", "Sint-Nik($og FN $ : x 1; 3 ~~ ; Ny ‘n oo oh Name a", "T A i"] },
      D: { path: ["Oostjachtpark", "Parklaan", "Peter Benoitstraat", "Hospitaalstraat", "Houtbriel", "Truweelstraat", "Singel", "Passtraat", "Damstraat", "Houten Schoen", "Industriepark-Noord", "Oostjachtpark 3 8 Molar % . \\ % 3 &"] },
      E: { path: ["Oostjachtpark", "Puitvoetstraat", "Gentse Baan", "Verzusteringslaan", "Sint-Antoniusstraat", "Schoolstraat", "Puitvoetstraat", "Hertenstraat", "Industriepark-Noord", "Oostjachtpark % \\ ~ HBolseld ) 4"] },
      F: { path: ["Oostjachtpark", "Industriepark-Noord", "Patotterijstraat", "Molendreef", "Zuidermolen", "Guido Gezellestraat", "Nijverheidslaan", "Steenweg Hulst-Lessen", "Kettermuitstraat", "Industriepark-West", "Industriepark-Noord", "Hoge Heerweg", "Oostjachtpark"] }
    },

    "wevelgem-1": {
      city: "Wevelgem",
      A: { path: ["MNoordstraat", "Driemasten", "Kwadries", "Nekkerplas Kwadestraat", "De Westakker", "Daalstraat", "Klijtstraat", "Noordstraat", "a ee ois", "\\ \\ Gulldgem \\"] },
      B: { path: ["Noordstraat", "Schuttershoflaan", "Dreef Ter Winkel", "Pastorijweg", "Albrecht Rodenbachlaan", "Het Putje", "Peter Benoitstraat", "Koningin Fabiolastraat", "Noordstraat"] },
      C: { path: ["Noordstraat", "Mellestraat", "Goethalslaan", "Heuleplaats", "Losschaert", "Rijksweg", "Noordstraat Moogesle : - : y AS £"] },
      D: { path: ["Noordstraat", "leperstraat", "Dadizelestraat", "Wittemolenstraalt", "Overheulestraat", "Noordstraat", "\\ a pe Moar ely %"] },
      E: { path: ["Noordstraat", "Caesar Gezellestraat", "3.164327,50.840731", "Karrestraat", "Wittemaolenstraat", "Oude Tramweg", "Ledegemstraat", "Noordstraat"] },
      F: { path: ["Noordstraat", "Dreef Ter Walle", "Europalaan", "Pastorijweqg", "Dorpsplein", "Heulestraat", "Zevenkaven", "Driemasten", "Noordstraat"] }
    },

    "brakel-1": {
      city: "Brakel",
      A: { path: ["Industrielaan", "Spoorwegstraat", "Vierschaar", "Gauwstraat", "Kasteeldreef", "Berendries", "Lepelstraat", "Kleibergstraat", "Industrielaan Nedgrt /"] },
      B: { path: ["Industrielaan", "Rondweg", "Oude Blekerijstraat", "Molenhoekstraat", "Driehoekstraat", "Tirse", "3.765376,50.8052071", "Theo Brakelsstraat", "Beekstraat", "Neearstraat", "Kasteelstraat", "Opbrakelsestraat", "Industrielaan"] },
      C: { path: ["Industrielaan", "Gentse Steenweg", "Astridlaan", "Felicien Cauwelstraat", "Nieuwewegg", "Warandestraat", "Vredestraat", "Industrielaan"] },
      D: { path: ["Industrielaan", "Bonte", "Faliestraat", "Ten Ede", "Eekhout", "Eekhout", "Meileveld", "Meerlaan", "Gustaafl Schockaertstraat", "Kazernstraat", "Broeder Mareslaan", "Godveerdegemstraat", "Tweekerkenstraat", "Kloosterstraat", "Brusselsestraat", "Industrielaan"] },
      E: { path: ["Industrielaan", "Nachtegaalstraat", "Grote Marijve", "Zuidstraat", "Verlorenstraat", "Industrielaan"] },
      F: { path: ["Industrielaan", "Bruul", "Wolvestraat", "Sint-Ambrosiusstraat", "Broeke", "Jan van Nassaustraat", "Peperstraat", "Verlorenstraal", "Ninovestraat", "Industrielaan"] }
    },

    "brugge-1": {
      city: "Brugge",
      A: { path: ["Monnikenwerve", "Blankenbergse Steenweg", "Beekweg", "Waggelwaterstraat", "Waggelwaterstraat", "Blankenbergse Steenweg", "Monnikenwerve ¥ Pt ; 2"], displayPath: ["Monnikenwerve", "Blankenbergse Steenweg", "Beekweg", "Waggelwaterstraat", "Blankenbergse Steenweg", "Monnikenwerve"], navigationPath: ["Monnikenwerve, 8000 Brugge", "Blankenbergse Steenweg, 8000 Brugge", "Beekweg, 8200 Brugge", "Waggelwaterstraat, 8200 Brugge", "Blankenbergse Steenweg, 8000 Brugge", "Monnikenwerve, 8000 Brugge"] },
      B: { path: ["Monnikenwerve", "Monnikenwerve", "Oostendse Steenweg", "Wijnenburgstraat", "Lauwerstraat", "Keizer Karelstraat", "Kardinaal Mercierstraal", "Maonnikenwerve"], displayPath: ["Monnikenwerve", "Oostendse Steenweg", "Wijnenburgstraat", "Lauwerstraat", "Keizer Karelstraat", "Kardinaal Mercierstraat", "Monnikenwerve"], navigationPath: ["Monnikenwerve, 8000 Brugge", "Oostendse Steenweg, 8000 Brugge", "Wijnenburgstraat, 8000 Brugge", "Lauwerstraat, 8000 Brugge", "Keizer Karelstraat, 8000 Brugge", "Kardinaal Mercierstraat, 8000 Brugge", "Monnikenwerve, 8000 Brugge"] },
      C: { path: ["Monnikenwerve", "Blankenbergse Steenweg", "Sint-Pietersmolenstraat", "Potentestraat", "Karel Ledeganckstraat", "Sint-Pietersgroenestraat", "Sint-Pieterskerklaan", "Wilgenstraat", "Zeveneke", "Monnikenwerve"], navigationPath: ["Monnikenwerve, 8000 Brugge", "Blankenbergse Steenweg, 8000 Brugge", "Sint-Pietersmolenstraat, 8000 Brugge", "Potentestraat, 8000 Brugge", "Karel Ledeganckstraat, 8000 Brugge", "Sint-Pietersgroenestraat, 8000 Brugge", "Sint-Pieterskerklaan, 8000 Brugge", "Wilgenstraat, 8000 Brugge", "Zeveneke, 8000 Brugge", "Monnikenwerve, 8000 Brugge"] },
      D: { path: ["Monnikenwerve", "Jan Breydellaan", "Witte-Beerstraat", "Legeweg", "Hogeweg", "Zandstraat", "Legeweg", "Monnikenwerve Fd % : S$. \\"], displayPath: ["Monnikenwerve", "Jan Breydellaan", "Witte-Beerstraat", "Legeweg", "Hogeweg", "Zandstraat", "Legeweg", "Monnikenwerve"], navigationPath: ["Monnikenwerve, 8000 Brugge", "Jan Breydellaan, 8200 Brugge", "Witte-Beerstraat, 8200 Brugge", "Legeweg, 8200 Brugge", "Hogeweg, 8200 Brugge", "Zandstraat, 8200 Brugge", "Legeweg, 8200 Brugge", "Monnikenwerve, 8000 Brugge"] },
      E: { path: ["Monnikenwerve", "Tempelhof", "Sint-Paulusstraat", "Potentestraat", "Scheepsdalelaan", "Leopold I-laan", "Baron Joseph Ryelandtstraat", "Lauwerstraat", "Karel de Stoutelaan", "N3571", "Monnikenwerve )~ - : Koolkerke B="], displayPath: ["Monnikenwerve", "Tempelhof", "Sint-Paulusstraat", "Potentestraat", "Scheepsdalelaan", "Leopold I-laan", "Baron Joseph Ryelandtstraat", "Lauwerstraat", "Karel de Stoutelaan", "N3571", "Monnikenwerve"], navigationPath: ["Monnikenwerve, 8000 Brugge", "Tempelhof, 8000 Brugge", "Sint-Paulusstraat, 8000 Brugge", "Potentestraat, 8000 Brugge", "Scheepsdalelaan, 8000 Brugge", "Leopold I-laan, 8000 Brugge", "Baron Joseph Ryelandtstraat, 8000 Brugge", "Lauwerstraat, 8000 Brugge", "Karel de Stoutelaan, 8000 Brugge", "N3571, 8000 Brugge", "Monnikenwerve, 8000 Brugge"] },
      F: { path: ["Monnikenwerve", "Sint-Pietersmolenstraat", "Oostendse Steenweg", "Waggelwaterstraat", "Sint-Pietersstatiedreef", "Wijnenburgstraat", "Rustenburgstraat", "Blankenbergse Steenweg", "Elzenstraat", "Sint-Pieterskerklaan", "Monnikenwerve"], navigationPath: ["Monnikenwerve, 8000 Brugge", "Sint-Pietersmolenstraat, 8000 Brugge", "Oostendse Steenweg, 8000 Brugge", "Waggelwaterstraat, 8200 Brugge", "Sint-Pietersstatiedreef, 8000 Brugge", "Wijnenburgstraat, 8000 Brugge", "Rustenburgstraat, 8000 Brugge", "Blankenbergse Steenweg, 8000 Brugge", "Elzenstraat, 8000 Brugge", "Sint-Pieterskerklaan, 8000 Brugge", "Monnikenwerve, 8000 Brugge"] }
    },

    "cuesmes-1": {
      city: "Cuesmes",
      A: { path: ["Rue du Grand Courant", "Rue de la Poire d'Or", "Rue de la Poire d'Or", "3.928091,50.437939", "Rue Emile Vandervelde", "Rue Emile Vandervelde", "Rue Hector Delanois", "Rue Hector Delancis", "Rue Hector Delanois", "Rue de Ciply", "Rue de Monte-En-Peine", "Rue de Monte-En-Peine", "Chaussée de Maubeuge", "Chaussée de Maubeuge", "Rue de Bertaimont", "Rue de Bouzanton", "Rue de la Poire d'Or", "Rue de la Poire d'Or", "Rue du Grand Courant aso\" _ / Mons ) Cy No _ gr", "« a J $ oo” N= F 2"] },
      B: { path: ["Rue du Grand Courant", "Rue de la Poire d'Or", "Rue des Sandrinettes", "Rue de la Poire d'Or", "Boulevard Sainctelette", "Boulevard Albert-Elisabeth", "Avenue Lemiez", "Place d'Hyon", "Rue de la Geniévrerie", "Rue Nicolas d'Hardenpont", "Avenue Reine Astrid", "Avenue de Jemappes", "Grand Route", "3.911677,50.450515", "Rue de la Poire d'Or", "3.916461,50.449467", "Rue du Grand Courant"] },
      C: { path: ["Rue du Grand Courant", "Rue de la Poire d'Or", "Rue de la Poire d'Or", "Digue de Cuesmes", "Avenue Jean d'’Avesnes", "Rue Lamir", "Rue de Cantimpret", "Rue de la Terre du Prince", "Rue de ['Athénee", "Rue du Rivage", "Place Leopold", "Avenue de Jemappes", "Grand'Route", "3.91323,50.450725", "Rue de la Poire d'Or", "Rue de a Poire d'Or", "Rue du Grand Courant 8 NS § Se"] },
      D: { path: ["Rue du Grand Courant", "Rue de la Poire d'Or", "Rue des Sandrinettes", "Rue de la Poire d'Or", "Rue de la Poire d'Or", "Rue André Masquelier", "Rue de la Petite Guirlande", "Grand-Rue", "Place du Marché aux Poissons", "Rue de I'Epargne", "Rue de la Tannerie", "Avenue du Général de Gaulle", "Rue Emile Vandervelde", "Rue Emile Vandervelde", "Rue Emile Vandervelde", "Rue Emile Vandervelde", "3.928276,50.438078", "Rue du Chemin de Fer", "3.924752,50.444663", "Rue du Grand Courant"] },
      E: { path: ["Rue du Grand Courant", "Rue de la Poire d'Or", "3.913425,50.45072 ~", "3.911564,50.45021", "Rue du Plan Incliné", "3.900057,50.446348", "Rue des Croix", "Rue des Croix Projetees", "Rue de l'Argiliere", "Rue du Moulin d'en Haut", "Rue Commandant Charles Lemaire", "Rue Jean Jaurés", "Rue du Cerisier", "Rue Ferrer", "Place de Cuesmes", "Place de Cuesmes", "Rue du Chemin de Fer", "Rue du Chemin de Fer", "3.924752,50.444663", "Rue du Grand Courant"] },
      F: { path: ["Rue du Grand Courant", "Rue de la Poire d'Or", "3.928091,50.437939", "Rue Emile Vandervelde", "Rue Emile Vandervelde", "Rue Emile Vandervelde", "Chaussée de Maubeuge", "Chaussée de Maubeuge", "Chaussée de Maubeuge", "Rue du Kéne a Caimont", "Rue de I'Héribus", "Rue de I'Espinette", "Avenue de la Grande Barre", "Rue des Iris", "Rue de Frameries", "3.909048,50.431871", "3.91455,50. 445722", "3.916644,50.449462", "Rue du Grand Courant"] }
    },

    "eeklo-1": {
      city: "Eeklo",
      A: { path: ["Industrielaan", "Ringlaan", "Leopoldlaan", "Krekelmuit", "Oude Staatsbaan", "Adegem-Dorp", "Adegem-Dorp", "Spanjaardshoek", "Kruisken", "Raverschootstraat", "Industrielaan um", "M A Oh"] },
      B: {
        path: ["Industrielaan", "Leopoldlaan", "OQudstrijderslaan", "Bogaardestraat", "Schouwburgplaats", "Buurtstraat", "Buurtstraat", "Koning Albertlaan", "N4¢", "Industrielaan"],
        displayPath: ["Industrielaan", "Leopoldlaan", "Oudstrijderslaan", "Bogaardestraat", "Schouwburgplaats", "Buurtstraat", "Koning Albertlaan", "N49", "B404", "Industrielaan"],
        navigationPath: ["Industrielaan, 9900 Eeklo", "Leopoldlaan, 9900 Eeklo", "Oudstrijderslaan, 9900 Eeklo", "Bogaardestraat, 9900 Eeklo", "Schouwburgplaats, 9900 Eeklo", "Buurtstraat, 9900 Eeklo", "Koning Albertlaan, 9900 Eeklo", "N49, 9900 Eeklo", "B404, 9900 Eeklo", "Industrielaan, 9900 Eeklo"]
      },
      C: {
        path: ["Industrielaan", "Stationsstraat", "39e Linielaan", "Marktstraat", "Marktstraat", "Koningin Astridlaan", "Prins Boudewijnlaan", "Industrielaan"],
        displayPath: ["Industrielaan", "N49", "N44", "Stationsstraat", "39e Linielaan", "Marktstraat", "Koningin Astridlaan", "Prins Boudewijnlaan", "Industrielaan"],
        navigationPath: ["Industrielaan, 9900 Eeklo", "N49, 9900 Eeklo", "N44, 9900 Eeklo", "Stationsstraat, 9900 Eeklo", "39e Linielaan, 9900 Eeklo", "Marktstraat, 9900 Eeklo", "Koningin Astridlaan, 9900 Eeklo", "Prins Boudewijnlaan, 9900 Eeklo", "Industrielaan, 9900 Eeklo"]
      },
      D: { path: ["Industrielaan", "Nieuwendorpe", "Tieltsesteenweg", "Koning Albertstraat", "Zandstraat", "Leikensweg", "Zuidmoerstraat", "Koningin Astridplein", "Brugsesteenweg", "Tuinwijklaan", "Galgenstraat", "Raverschootstraat", "Industrielaan"] },
      E: { path: ["Incdlustrielaan", "Slachthuisstraat", "Tieltsesteenweg", "Molenstraat", "Pastoor De Nevestraat", "Weversstraat", "Zandvleuge", "Rabautstraat", "Boelare", "Moeje", "Slachthuisstraat", "Industrielaan"] },
      F: { path: ["Industrielaan", "Vrombautstraat", "Nieuwstraat", "Aveschoot", "Oostveldstraat", "Industrielaan"] }
    },

    "geel-1": {
      city: "Geel",
      A: { path: ["Lammerdries", "Moleneinde", "Lindenstraat", "Boerenkrijglaan", "Bulestraat", "Het Bremmeken", "Dokter De Biestraat", "Schommenstraat", "Hoogbuul", "Lammerdries Az aN \\"] },
      B: { path: ["Lammerdries", "Industrielaan", "Schaatsbergen", "Het Bremmeken", "Noorderwijksewegg", "Rode Driezen", "Kijnigestraat", "Heiblokken", "Stadsestraat", "Lammaerdries"] },
      C: { path: ["Lammerdries", "Geelseweg", "Boerenkrijglaan", "Zavelstraat", "Sint-Jobsstraat", "Watertorenstraat", "Beilen", "Lammerdries"] },
      D: { path: ["Lammerdries", "Veldstraat", "Geerbossen", "Langepad", "P, Verhaertstraat", "Larumseweg", "Zurkelberg", "Pastoriestraat", "Beilen", "Gerheiden", "Lammerdries"] },
      E: { path: ["Lammerdries", "Waalburg", "Anemoonstraal", "Elsum", "Meldoornstraat", "Lellestraat", "Westelijke Ring", "Lammerdries"] },
      F: { path: ["Lammerdries", "Velveken", "Larumseweg", "Larumseweg", "Leliestraat", "Valkenborch", "Eikenstraat", "Westelijke Ring", "Antwerpseweg", "Lammerdries"] }
    },

    "suarlee-1": {
      city: "Namur",
      A: { path: ["Nouvelle Route de Suarlée", "Nouvelle Route de Suarlée", "Chaussee de la Gare", "Chaussée de la Gare", "Rue de la Station", "Rue des Chomeurs", "Rue aux Cailloux", "Rue d’Emines", "Rue Bonwez", "Rue Bonwez", "Rue du Ry des Mines", "Rue du Ry des Mines", "Avenue d'Ecolys", "Nouvelle Route de Suarlée"] },
      B: { path: ["Nouvelle Route de Suarlée + N4", "Route de Floreffe", "Chaussée de Nivelles", "Avenue Joseph Abras", "Rue de \\ Gembloux", "Nouvelle Route de Suarlée"] },
      C: { path: ["Nouvelle Route de Suarlée", "Rue du Fond du Marechal", "Rue du Fond du Maréchal", "Route de Floreffe", "Rue du Grand Falllis", "Rue de la Sapinette", "Rue de a Sapinette", "Chaussée de Nivelles", "Rue de I'Aérodrome", "Nouvelle Route de Suarléee"] },
      D: { path: ["Nouvelle Route de Suarlee", "Rue de Gembloux", "Chemin de la Plaine", "Rue de la Grande Campagne", "Rue Auguste Leblanc", "Avenue Reine Astrid", "Avenue Baron Louis Huart", "Rue Mazy", "Rue Verte", "Nouvelle Route de Suarlée"] },
      E: { path: ["Nouvelle Route de Suarlée", "Nouvelle Route de Suarlée «", "NS04 -+ Rue de Gembloux", "Rue de Gembloux", "Rue de Gembloux", "Rue de Gembloux", "Rue de Gembloux", "Rue ge la Cheminee", "Chaussee de Waterloo", "Rue du Cure Hiernaux", "Allée des Cerisiers", "Chaussee de Nivelles", "Route de Floreffe", "4,789529,50.493219", "Nouvelle Route de Suarlee"] },
      F: { path: ["Nouvelle Route de Suarlée", "Rue du Fond du Marechal", "Rue du Fond du Marechal", "Avenue d'Ecolys", "Route de Louvain-la-Neuve", "Route de Louvain-la-Neuve", "Route de Louvain-la-Neuve", "Rue du Treizieme de Ligne", "Rue des Champs", "Avenue Joseph Abras", "Chaussée de Nivelles", "Route de Floreffe", "Route de Louvain-la-Neuve", "4.789529,50.493219", "Nouvelle Route de Suarlée"] }
    },

    "tihange-1": {
      city: "Tihange",
      A: { path: ["Rue Albert Legrand", "Porte des Aveugles", "Chaussée de Waremme", "Rue Hasquette", "Avenue Hippolyte Dumont", "Rue Chénia", "Rue Albert Legrand"] },
      B: { path: ["Rue Albert Legrand", "Grand-Route", "Rue du Marais", "Rue de la Motte", "Rue d'Angleterre", "Avenue Godin Parnajon", "Chaussée de Liege", "Avenue Albert Ter", "Rue des Vignes", "Porte des Aveugles", "Pont Rol Baudouin", "Quai d'Arona", "Quai .d'Arana", "Quai d'Arona", "Avenue de I'Industrie", "Rue Albert Legrand"] },
      C: { path: ["Rue Albert Legrand", "5.266402,50.53157", "Avenue de l'industrie", "5.284891,50.537379", "Quaii de Lorraine * Chaussée de Liége", "Quai de Compiégne", "Quai de Compiégne", "N617e", "Avenue Charles et Louis Godin Avenue Adolphe Chapelle", "Rue d'Angleterre", "Grand-Route", "Rue Albert Legrand % VO . “© vg"] },
      D: { path: ["Rue Albert Legrand", "Rue du Marais", "Rue des Bons Enfants", "Avenue de a Croix-Rouge", "Rue des Vergiers", "Rue Adolphe Bastin", "Rue du Long Thier", "Rue des Messes", "Rue de la Mairie", "Rue Albert Legrand ACL Calpe / F Lo ’"] },
      E: { path: ["Rue Albert Legrand", "Rue de la Justice", "Quai d'’Arona", "Place Saint-Germain", "Rue Saint-Pierre", "Quai de Compiegne", "Chaussee Roosevelt", "Rue Julien Jacquet", "Rue de la Liberté", "Rue du Pont", "Avenue de l'industrie", "Avenue de I'Industrie", "Rue Albert Legrand No", "Tihange Cn ad 2 YE % rr A p =, 3 ”"] },
      F: { path: ["Rue Albert Legrand", "Grand-Route", "Rue des Malles Terres", "Rue des Malles Terres", "Rue Longue Ruelle", "Rue Longue Ruelle", "Les Golettes", "Les Golettes", "Rue du Haut Mas", "Rue d'lItalie", "Rue Jean Jaures", "Quai d'Arona", "Quai d'Arona", "Grand-Route", "Rue Albert Legrand"] }
    },

    "tournai-1": {
      city: "Tournai",
      A: { path: ["Rue du Serpalet", "Rue du Serpolet", "Chaussee de Lille", "Chaussee de Lille", "Chaussée de Lille", "Rue des Bouchers Saint-Jacques", "Rue des Soeurs Noires", "Terrasse de la Madeleine", "Rue Francois-Joseph Peterinck", "Avenue de Maire", "Chaussée de Tournai", "Chaussée de Tournai", "3.362486,50.630309", "3.32332,50.614113", "3.321681,50.615394", "3.330463,50.61479", "Rue de la Terre a Briques", "Rue du Serpolet ( Foam 4 ym be al", "“Tournai [NY : ’"] },
      B: { path: ["Rue du Serpolet", "Rue du Serpolet", "Chaussee de Lille", "Chaussée de Lille", "Chaussée de Lille", "Place de Lille", "Grand'Place", "Rue de I'Yser", "Rue Saint-Jacques", "Rue Floc a Brebis", "Boulevard Léopold", "Avenue de Maire", "Avenue de Maire", "Chaussée de Lannoy", "Chaussée de Lannoy", "Rue de la Terre a Briques", "Rue de la Terre a Briques", "Rue de la Terre a Briques", "Rue de la Terre a Briques", "Rue du Serpolet"] },
      C: { path: ["Rue du Serpolet", "Rue du Serpolet", "N516 3.329303,50.614125", "3.361904,50.627754", "Chaussee de Tournai", "Rue de a Borgnette", "Rue Pasquier Grenier", "Rue des Roctiers", "Boulevard Delwart", "3.375048,50,612236", "3.374875,50.611717", "Boulevard Léopold", "Avenue des Erables", "Vieux Chemin Willems", "Avenue Minjean", "Chaussee de Lille", "Rue de la Terre a Briques", "Rue du Serpolet"] },
      D: { path: ["Rue du Serpolet", "Rue du Serpolet", "Rue de la Terre a Briques", "Rue de la Terre a Briques", "Rue de la Terre a Briques", "Chaussee de Lannoy", "Chaussée de Lannoy", "Chaussée du Pont Royal", "Rue de I'Escalette", "Avenue de Maire", "Rue Francois-Joseph Peterinck", "Rue de I'Ecorcherie", "Rue du Bourdon Saint-Jacques", "Rue de la Téte d'Argent", "Rue Perdue", "Chaussée de Lille", "Chaussée de Lille", "Chaussée de Lille", "Rue de la Terre a Briques", "Rue du Serpolet"] },
      E: { path: ["Rue du Serpolet", "Rue du Serpolet", "3.329303,50.614125", "3.361805,50.627744", "Chaussée de Tournal", "Rue de I'Escalette", "Rue Saint-Eleuthére", "Avenue de Maire", "Rue des Magasins", "Rue de I'Arsenal", "Avenue Edmond Wibaut", "Quai Dumon", "Placette aux Oignons", "Place de Lille", "Chaussée de Lille", "Chaussée de Lille", "Rue de la Terre a Briques", "Rue du Serpolet"] },
      F: { path: ["Rue du Serpolet", "Rue du Serpolet", "Chaussée de Lille", "Chaussée de Lille", "Rue Claquedent", "Rue des Soeurs Noires", "Rue du Cygne", "Rue du Becquerelle", "Avenue Edmond Wibaut", "Rue du Viaduc", "Rue de Breuze", "3.416152,50.627831", "3.413126,50.63439", "3.32332,50.614113", "3.323143,50.615358", "3.325963,50.612694", "Rue de la Terre a Briques", "Rue du Serpolet"] }
    },

    "wandre-1": {
      city: "Wandre",
      A: { path: ["Avenue de l'Indépendance", "~ Rue de Visé", "Rue de Meuse", "Rue Charlemagne", "Rue de Bois de Breux", "Rue de Bois de Breux", "Place Gilles Etienne", "Rue des Pocheteux", "Rue de Bois de Breux", "Rue Bodson", "Rue de Herve", "Rue de Herve", "Avenue de la Rousseliere", "Avenue Henri-Warnant", "Avenue Henri*Warnant", "Rue de Beyne", "Rue de Beyne", "Rue Chafnay", "Rue de Visé", "Avenue de I'Indépendance"] },
      B: { path: ["Avenue de I'Indépendance", "Avenue Georges Truffaut", "Pont Barrage de Monsin", "Rue de I'lle Monsin", "Rue de 'lle Monsin", "Rue de 'lle Monsin", "Boulevard Albert 1er", "Rue du Pont de Wandre", "Rue Vieille Voie", "Rue de Hoignée", "Route du Pays de Liege", "Rue de Rabosee", "Rue de la Forét", "Rue de la Forét", "Rue de la Forét", "Avenue de l'Indépendance"] },
      C: { path: ["Avenue de lI'Indépendance", "Rue Pont Barrage de Monsin", "Pont Marexhe", "Quai de Coronmeuse", "Pont Atlas", "Rue Winston Churchill", "Avenue de I'Indépendance Herstal \\ , 7 ag #", "=> 4 i Af Bressoux"] },
      D: { path: ["Avenue de I'Indépendance", "Rue de Vise", "Avenue Georges Truffaut", "Rue Pont Barrage de Monsin", "Rue de 'lle Monsin", "Pont Marexhe", "5.616426,50.654796", "Place Coronmeuse", "Rue Jean-Baptiste Cools", "Rue du Ruisseau", "Rue Dony", "Rue Maghin", "Rue Saint-Léonard", "Quai Saint-Léconard", "N671i", "Avenue Georges Truffaut", "5.623515,50,6512685", "Avenue Georges Truffaut", "Rue de Visé", "Avenue de I'indépendance"] },
      E: {
        path: ["Avenue de I'Indépendance", "Avenue de l'Indépendance", "Avenue de I'iIndépendance", "Rue de la Clawenne", "Avenue de la Croix Rouge", "Rue des Mimosas", "Rue en Bois", "Rue de Hermée", "5,627248,50.688486", "5.672557,50.688198", "5.672872,50.687651", "Rue de Visé", "Rue de Visé", "Avenue de l'Indépendance"],
        navigationPath: ["Avenue de l'Indépendance", "Rue de la Clawenne", "Avenue de la Croix Rouge", "Rue des Mimosas, Liège", "Rue en Bois", "Rue de Hermée", "5.627248,50.688486", "5.672557,50.688198", "5.672872,50.687651", "Rue de Visé", "Avenue de l'Indépendance"]
      },
      F: { path: ["Avenue de l'Indépendance", "Rue de Visé", "Rue Bastin", "Place d'Elmer", "Rue de Vise", "Avenue de l'Indépendance"] }
    },

    "gent-sdw": {
      city: "Gent",
      A: { path: ["Poortakkerstraat", "Bijenstraat", "Twaalfapostelenstraat", "Kortrijksesteenweg", "Zieklien", "Voskenslaan", "Valentin Vaerwyckweg", "Poortakkerstraat"], imageUrl: "assets/GentrouteA.png" },
      B: { path: ["Poortakkerstraat", "Louis Bl?riotlaan", "R4", "Renbaanstraat", "Rijsenbergstraat", "Aaigemstraat", "Koningin Fabiolalaan", "Sint-Denijslaan", "Poortakkerstraat"], imageUrl: "assets/GentrouteB.png" },
      C: { path: ["Poortakkerstraat", "Kleinkouterken", "Steenaardestraat", "Beukenlaan", "Beukenlaan", "Stormvogelstraat", "B402", "Poortakkerstraat"], imageUrl: "assets/GentrouteC.png" },
      D: {
        path: ["Poortakkerstraat", "N60", "Hagedisstraat", "Kikvorsstraat", "Zwijnaardsesteenweg", "Voskenslaan", "Valentin Vaerwyckweg", "Poortakkerstraat"],
        displayPath: ["Poortakkerstraat", "N60", "Hagedisstraat", "Kikvorsstraat", "Zwijnaardsesteenweg", "Voskenslaan", "Valentin Vaerwyckweg", "Poortakkerstraat"],
        navigationPath: ["Poortakkerstraat 127, 9051 Gent", "Oudenaardsesteenweg, 9000 Gent", "Hagedisstraat, 9000 Gent", "Kikvorsstraat, 9000 Gent", "Zwijnaardsesteenweg, 9000 Gent", "Voskenslaan, 9000 Gent", "Valentin Vaerwyckweg, 9000 Gent", "Poortakkerstraat 127, 9051 Gent"]
      },
      E: { path: ["Poortakkerstraat", "Bijenstraat", "Kortrijksesteenweg", "Adelaarsstraat", "Maurice Dewulflaan", "Neststraat", "Luchthavenlaan", "Loofblommestraat", "Sint-Dionysiusstraat", "3.684617,51.023314", "Poortakkerstraat"] },
      F: {
        path: ["Poortakkerstraat", "Kortrijksesteenweg", "Oudeheerweg", "Hogeheerweg", "Gladioollaan", "Gentiaanlaan", "Luchthavenlaan", "Witbakkerstraat", "Louis Bl?riotlaan", "Poortakkerstraat"],
        displayPath: ["Poortakkerstraat", "Kortrijksesteenweg", "Oudeheerweg", "Hogeheerweg", "Gladioollaan", "Gentiaanlaan", "Luchthavenlaan", "Witbakkerstraat", "Louis Blériotlaan", "B402", "Poortakkerstraat"],
        navigationPath: ["Poortakkerstraat 127, 9051 Gent", "Kortrijksesteenweg, 9051 Gent", "Oudeheerweg, 9051 Gent", "Hogeheerweg, 9051 Gent", "Gladioollaan, 9051 Gent", "Gentiaanlaan, 9051 Gent", "Luchthavenlaan, 9051 Gent", "Witbakkerstraat, 9051 Gent", "Louis Blériotlaan, 9051 Gent", "B402, 9051 Sint-Denijs-Westrem", "Poortakkerstraat 127, 9051 Gent"]
      }
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

  function routeImageUrl(centerId, letter) {
    const prefix = ROUTE_IMAGE_PREFIXES[centerId];
    return prefix ? ('assets/' + prefix + 'route' + letter + '.png') : null;
  }

  function cleanRouteStop(stop) {
    const raw = String(stop || '').trim();
    if (!raw) return null;
    const roadCoord = /^(?:[ABENR]\.?\d{1,4}(?:\.\d{1,4})*)\s+(-?\d[\d.,\s-]+)$/.exec(raw);
    if (roadCoord && asCoord(roadCoord[1])) return normalizeCoordInput(roadCoord[1]);
    const normalizedCoordRaw = normalizeCoordInput(raw);
    if (/^A\s*0+\d+\.\d+$/i.test(normalizedCoordRaw)) return null;
    const roadCode = normalizeRoadCodeInput(normalizedCoordRaw);
    if (roadCode) return roadCode;
    if (asCoord(raw)) return normalizedCoordRaw;

    const replacements = [
      [/^Nieshofstraat\b.*$/i, 'Nieshofstraat'],
      [/^Oostjachtpark\b.*$/i, 'Oostjachtpark'],
      [/^Industrielaan\b.*(?:Nedgrt|!)?.*$/i, 'Industrielaan'],
      [/^Santvoortbeeklaan\b.*Schoten.*$/i, 'Santvoortbeeklaan'],
      [/^Lammerdries\b.*$/i, 'Lammerdries'],
      [/^Lammaerdries$/i, 'Lammerdries'],
      [/^Ambachtenlaan\b.*$/i, 'Ambachtenlaan'],
      [/^Campus Strasse\b.*$/i, 'Campus Strasse'],
      [/^Noordstraat\b.*$/i, 'Noordstraat'],
      [/^MNoordstraat$/i, 'Noordstraat'],
      [/^Rue du Lion Belge\b.*$/i, 'Rue du Lion Belge'],
      [/^Rue du Grand Courant\b.*$/i, 'Rue du Grand Courant'],
      [/^Rue de Binche\b.*$/i, 'Rue de Binche'],
      [/^Rue de \[?['I]?Abbaye$/i, "Rue de l'Abbaye"],
      [/^Rue de 'Abattoir$/i, "Rue de l'Abattoir"],
      [/^Bois de Lobbes(?:,\s*6540\s+Lobbes)?$/i, 'Bois de Lobbes, 6540 Thuin'],
      [/^Rue de Ia Grattiere$/i, 'Rue de la Grattière'],
      [/^Rue de la Gratti[eé]re$/i, 'Rue de la Grattière'],
      [/^Rue de \['Ath[eé]nee$/i, "Rue de l'Athénée"],
      [/^Rue de a Poire d'Or$/i, "Rue de la Poire d'Or"],
      [/^Rue de la Poire d'Or\b.*$/i, "Rue de la Poire d'Or"],
      [/^Avenue de a Croix-Rouge$/i, 'Avenue de la Croix-Rouge'],
      [/^Nouvelle Route de Suarl[ée]e?\b.*$/i, 'Nouvelle Route de Suarlée'],
      [/^Chaussee de la Gare$/i, 'Chaussée de la Gare'],
      [/^Rue des Chomeurs$/i, 'Rue des Chômeurs'],
      [/^Rue du Fond du Marechal$/i, 'Rue du Fond du Maréchal'],
      [/^Rue du Grand Falllis$/i, 'Rue du Grand Falis'],
      [/^Rue de a Sapinette$/i, 'Rue de la Sapinette'],
      [/^Rue de I'Aérodrome$/i, "Rue de l'Aérodrome"],
      [/^NS04 -\+ Rue de Gembloux$/i, 'Rue de Gembloux'],
      [/^Rue ge la Cheminee$/i, 'Rue de la Cheminée'],
      [/^Chaussee de Waterloo$/i, 'Chaussée de Waterloo'],
      [/^Rue du Cure Hiernaux$/i, 'Rue du Curé Hiernaux'],
      [/^Chaussee de Nivelles$/i, 'Chaussée de Nivelles'],
      [/^Rue du Treizieme de Ligne$/i, 'Rue du Treizième de Ligne'],
      [/^Avenue Albert Einstein\b.*$/i, 'Avenue Albert Einstein'],
      [/^Boulevard Baudouin (?:Ter|ler|1er)$/i, 'Boulevard Baudouin 1er'],
      [/^Boulavard Baudouln Ter$/i, 'Boulevard Baudouin 1er'],
      [/^N25 \+ N25$/i, 'N25'],
      [/^E411 E411$/i, 'E411'],
      [/^AQD4 464\b.*$/i, null],
      [/^A 004\.465$/i, null],
      [/^Boulevard du Brabant Wallan$/i, 'Boulevard du Brabant Wallon'],
      [/^Boulevard de Wallonwe-Nord$/i, 'Boulevard de Wallonie-Nord'],
      [/^Rue du Bosquetl$/i, 'Rue du Bosquet'],
      [/^Voie de a Freneraie$/i, 'Voie de la Frêneraie'],
      [/^Voie de la Freneraie$/i, 'Voie de la Frêneraie'],
      [/^Chaussae de Wavrie$/i, 'Chaussée de Wavre'],
      [/^Chaussee de Namur$/i, 'Chaussée de Namur'],
      [/^Rue de a Sarte$/i, 'Rue de la Sarte'],
      [/^Rue de 'Energie$/i, "Rue de l'Energie"],
      [/^Route de Chatelet$/i, 'Route de Châtelet'],
      [/^Rue de la fombe$/i, 'Rue de la Tombe'],
      [/^Rue des Fougéres$/i, 'Rue des Fougères'],
      [/^Rue du Pays de Liege$/i, 'Rue du Pays de Liège'],
      [/^Route du Pays de Liege$/i, 'Route du Pays de Liège'],
      [/^Chaussee de Charleroi$/i, 'Chaussée de Charleroi'],
      [/^Chaussee de Mons$/i, 'Chaussée de Mons'],
      [/^Chaussee d'Ecaussinnes$/i, "Chaussée d'Ecaussinnes"],
      [/^Chaussee d'Arlon$/i, "Chaussée d'Arlon"],
      [/^Chaussee de Philippeville$/i, 'Chaussée de Philippeville'],
      [/^Rue du Déyersoir$/i, 'Rue du Déversoir'],
      [/^Rue Duc Saint Sim(?:on|eon)\b.*$/i, 'Rue Duc Saint Simon'],
      [/^Avenue de a Libération$/i, 'Avenue de la Libération'],
      [/^Avenue de I'?Ind[eé]pendance\b.*$/i, "Avenue de l'Indépendance"],
      [/^Avenue de I'?iInd[eé]pendance\b.*$/i, "Avenue de l'Indépendance"],
      [/^Avenue de I'?Industrie$/i, "Avenue de l'Industrie"],
      [/^~ Rue de Visé$/i, 'Rue de Visé'],
      [/^Rue de I'?lle Monsin$/i, "Rue de l'Ile Monsin"],
      [/^Rue de 'lle Monsin$/i, "Rue de l'Ile Monsin"],
      [/^Avenue Henri\*Warnant$/i, 'Avenue Henri-Warnant'],
      [/^Rue de Vise$/i, 'Rue de Visé'],
      [/^Rue Albert Legrand\b.*$/i, 'Rue Albert Legrand'],
      [/^Quai d['’]’Arona$/i, "Quai d'Arona"],
      [/^Quai \.d'Arana$/i, "Quai d'Arona"],
      [/^Quaii de Lorraine\b.*$/i, 'Quai de Lorraine'],
      [/^Chaussee Roosevelt$/i, 'Chaussée Roosevelt'],
      [/^Chaussée de Liége$/i, 'Chaussée de Liège'],
      [/^Chaussée de Liege$/i, 'Chaussée de Liège'],
      [/^Rue de a Plovinate$/i, 'Rue de la Plovinate'],
      [/^Rue a Dettes$/i, 'Rue à Dettes'],
      [/^Rue de Binche i$/i, 'Rue de Binche'],
      [/^Route des Fusilles$/i, 'Route des Fusillés'],
      [/^Rue du Chateau$/i, 'Rue du Château'],
      [/^Rue du Chateau d'Eau$/i, "Rue du Château d'Eau"],
      [/^Rue du Vieux Cimetiere$/i, 'Rue du Vieux Cimetière'],
      [/^Rue du Marche Couvert$/i, 'Rue du Marché Couvert'],
      [/^Route de Marche$/i, 'Route de Marche'],
      [/^Place General Mac-Auliffe$/i, 'Place Général Mac-Auliffe'],
      [/^Porte-de-Treves$/i, 'Porte-de-Trèves'],
      [/^Place Leopold$/i, 'Place Léopold'],
      [/^Rue des Croix Projetees$/i, 'Rue des Croix Projetées'],
      [/^Rue de l'Argiliere$/i, "Rue de l'Argilière"],
      [/^Quai de Compiegne$/i, 'Quai de Compiègne'],
      [/^Rue d'lItalie$/i, "Rue d'Italie"],
      [/^Avenue Jean d['’]’Avesnes$/i, "Avenue Jean d'Avesnes"],
      [/^Rue de I'Héribus$/i, "Rue de l'Héribus"],
      [/^Rue de I'Espinette$/i, "Rue de l'Espinette"],
      [/^Rue de I'Epargne$/i, "Rue de l'Epargne"],
      [/^Rue de I'Eglise$/i, "Rue de l'Eglise"],
      [/^Rue de I'Ecole$/i, "Rue de l'Ecole"],
      [/^Rue Pierre Baily$/i, 'Rue Pierre Bailly'],
      [/^Avenue de la Cite Parc$/i, 'Avenue de la Cité Parc'],
      [/^Noretherstralle$/i, 'Nöretherstraße'],
      [/^HockstraRe$/i, 'Hochstraße'],
      [/^JudenstralRe$/i, 'Judenstraße'],
      [/^Hochstralle$/i, 'Hochstraße'],
      [/^Hookstralle$/i, 'Hochstraße'],
      [/^Neutralstralle$/i, 'Neutralstraße'],
      [/^NeutralstraRe$/i, 'Neutralstraße'],
      [/^Industriestrale$/i, 'Industriestraße'],
      [/^Schdnefelderweg$/i, 'Schönefelderweg'],
      [/^lddergemstraat\b.*$/i, 'Iddergemstraat'],
      [/^Rue du Hache!$/i, 'Rue du Hachet'],
      [/^4 !.*$/i, null],
      [/^Rue du Serpolet\b.*Foam.*$/i, 'Rue du Serpolet'],
      [/^Monnikenwerve\b.*$/i, 'Monnikenwerve'],
      [/^Maonnikenwerve$/i, 'Monnikenwerve'],
      [/^Kardinaal Mercierstraal$/i, 'Kardinaal Mercierstraat'],
      [/^Louis Bl\?riotlaan$/i, 'Louis Blériotlaan'],
      [/^Rue de \\ Gembloux$/i, 'Rue de Gembloux']
    ];
    for (const [pattern, value] of replacements) {
      if (pattern.test(raw)) return value;
    }

    const normalized = raw
      .replace(/[’‘`]/g, "'")
      .replace(/weqg?/gi, 'weg')
      .replace(/wegg\b/gi, 'weg')
      .replace(/\bI'(?=[A-ZÀ-Ý])/g, "l'")
      .replace(/\bd''(?=[A-ZÀ-Ý])/g, "d'")
      .replace(/\bd'(?=’)/g, "d'")
      .replace(/\s+/g, ' ')
      .trim();

    const symbolCount = (normalized.match(/[\\{}#<>[\]|~=_Â©®¢“”%!*"§£]/g) || []).length;
    const letterCount = (normalized.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    if (normalized.startsWith('=>') || symbolCount >= 2 || (symbolCount >= 1 && letterCount < 8)) return null;
    if (/^(?:4\s*:\s*eh\s*oy|4 i Schoten of|J f Coulliet|\)\s*irr J|\(.?\)\s*Marcime|l'Eveque Anderiues|Tihange\b|J eck|be dinges|Puprdero|RR BY|T A i$|M A Oh$|HOCKem|Ne["”]|at\?)/i.test(normalized)) return null;
    if (/\\|=>/.test(normalized)) return null;
    return normalized;
  }

  function cleanRoutePath(path, options = {}) {
    if (!path || path.length < 2) return null;
    const cleaned = [];
    path.forEach(stop => {
      const s = cleanRouteStop(stop);
      if (!s) return;
      if (options.hideCoords && asCoord(s)) return;
      if (cleaned[cleaned.length - 1] === s) return;
      cleaned.push(s);
    });
    return cleaned.length >= 2 ? cleaned : null;
  }

  function postalCityHint(address, fallbackCity) {
    const match = /\b(\d{4})\s+([^,]+)/.exec(String(address || ''));
    return match ? (match[1] + ' ' + match[2].trim()) : fallbackCity;
  }

  function qualifyNavigationPath(path, address, effectiveCity) {
    if (!path || path.length < 2) return null;
    const roadHint = postalCityHint(address, effectiveCity);
    return path.map(stop => {
      const coord = asCoord(stop);
      if (coord) return normalizeCoordInput(stop);
      if (/^Rue de l'Abattoir(?:,\s*(?:Binche|Lobbes))?$/i.test(stop)) return "Rue de l'Abattoir, Thuin";
      if (/^Bois de Lobbes(?:,\s*6540\s+Lobbes)?$/i.test(stop)) return 'Bois de Lobbes, 6540 Thuin';
      const roadCode = normalizeRoadCodeInput(stop);
      if (roadCode) return roadCode + ', ' + roadHint;
      return stop;
    });
  }

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
      const cleanedPath = cleanRoutePath(path);
      const displayPath = o.displayPath || cleanRoutePath(path, { hideCoords: true }) || cleanedPath;
      const navigationPath = o.navigationPath || qualifyNavigationPath(cleanedPath, address, effectiveCity);
      const mapsPath = navigationPath || displayPath || path;
      const mapsUrl = (mapsPath && gmapsPath(mapsPath, effectiveCity)) || gmaps(address + ', ' + cityName);
      const fLetter = LETTER_FLAVOR_CYCLE[letter] || 'A';
      return {
        id: centerId + '-' + letter.toLowerCase(),
        label: tri('Route ' + letter, 'Route ' + letter, 'Itinéraire ' + letter),
        focus: f[fLetter].focus,
        difficulty: diffMap[letter],
        distanceKm: o.distanceKm != null ? o.distanceKm : variance(centerId, letter, base[letter].dist, base[letter].distSpread),
        durationMin: o.durationMin != null ? o.durationMin : variance(centerId, letter, base[letter].dur, base[letter].durSpread),
        image: fLetter,
        imageUrl: o.imageUrl || routeImageUrl(centerId, letter),
        tags: f[fLetter].tags,
        notes: f[fLetter].notes,
        path: path,
        displayPath: displayPath,
        navigationPath: navigationPath,
        cityHint: effectiveCity,
        googleMapsUrl: mapsUrl
      };
    });
  }

  function makeCenter(id, nameNl, nameEn, nameFr, operator, address, phone, opts) {
    opts = opts || {};
    return {
      id,
      name: tri(nameNl, nameEn, nameFr),
      operator, address, phone,
      routes: makeRoutes(id, address, nameNl),
      comingSoon: !!opts.comingSoon
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
    { id: 'brakel', name: tri('Brakel', 'Brakel', 'Brakel'), region: 'flanders', province: tri('Oost-Vlaanderen', 'East Flanders', 'Flandre-Orientale'),
      centers: [makeCenter('brakel-1', 'Examencentrum Brakel', 'Brakel Exam Center', 'Centre d\'examen Brakel', 'SBAT', 'Industrielaan 8, 9660 Brakel', '+32 55 42 44 23')] },
    { id: 'asse-mollem', name: tri('Asse-Mollem', 'Asse-Mollem', 'Asse-Mollem'), region: 'flanders', province: tri('Vlaams-Brabant', 'Flemish Brabant', 'Brabant flamand'),
      centers: [makeCenter('assemollem-1', 'Examencentrum Asse-Mollem', 'Asse-Mollem Exam Center', 'Centre d\'examen Asse-Mollem', 'GOCA', 'Assesteenweg 117, 1730 Asse', '+32 2 452 71 81')] },
    { id: 'heverlee', name: tri('Heverlee', 'Heverlee', 'Heverlee'), region: 'flanders', province: tri('Vlaams-Brabant', 'Flemish Brabant', 'Brabant flamand'),
      centers: [makeCenter('haasrode-1', 'Examencentrum Haasrode', 'Haasrode Exam Center', 'Centre d\'examen Haasrode', 'GOCA', 'Interleuvenlaan 64, 3001 Heverlee', '+32 16 39 89 89')] },
    { id: 'anderlecht', name: tri('Anderlecht', 'Anderlecht', 'Anderlecht'), region: 'brussels', province: tri('Brussel', 'Brussels', 'Bruxelles'),
      centers: [makeCenter('anderlecht-1', 'Examencentrum Anderlecht', 'Anderlecht Exam Center', 'Centre d\'examen Anderlecht', 'GOCA / SBAT', 'Industrielaan 22, 1070 Anderlecht', '+32 2 521 89 76', { comingSoon: true })] },
    { id: 'schaerbeek', name: tri('Schaarbeek / Evere', 'Schaerbeek / Evere', 'Schaerbeek / Evere'), region: 'brussels', province: tri('Brussel', 'Brussels', 'Bruxelles'),
      centers: [makeCenter('schaerbeek-1', 'Examencentrum Schaarbeek', 'Schaerbeek Exam Center', 'Centre d\'examen Schaerbeek', 'GOCA / SBAT', 'Colonel Bourgstraat 118, 1140 Evere', '+32 2 736 89 19', { comingSoon: true })] },
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
