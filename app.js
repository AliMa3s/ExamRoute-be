/* ExamRoute Belgium - vanilla JS app */
(function () {
  'use strict';

  const STORAGE_KEY = 'examroute.lang';

  // ===================== i18n =====================
  const I18N = {
    nl: {
      chooseLanguage: 'Kies je taal',
      tagline: 'Belgische oefenroutes',
      searchPlaceholder: 'Zoek stad, regio, examencentrum of adres',
      filterAll: 'Alle', filterBrussels: 'Brussel', filterFlanders: 'Vlaanderen', filterWallonia: 'Wallonië',
      cities: 'Steden', centers: 'Examencentra', routes: 'Oefenroutes', back: 'Terug',
      noResults: 'Geen resultaten gevonden.',
      disclaimerShort: 'Enkel ter oefening. Bevestig officiële details bij het examencentrum.',
      disclaimerLong: 'Enkel ter oefening. Dit zijn voorgestelde oefenroutes, geen officiële examenroutes. Bevestig altijd de details bij het examencentrum.',
      openMaps: 'Open in Google Maps',
      address: 'Adres', operator: 'Operator', phone: 'Telefoon',
      duration: 'min', distance: 'km', focus: 'Focus', notes: 'Aandachtspunten',
      cityCount: (n) => `${n} stad${n === 1 ? '' : 'en'}`,
      regionFlanders: 'Vlaanderen', regionWallonia: 'Wallonië', regionBrussels: 'Brussel',
      centerCount: (n) => `${n} centrum${n === 1 ? '' : 's'}`,
      aboutTitle: 'Over ExamRoute',
      aboutVersion: 'Versie 1.0',
      aboutText: 'ExamRoute helpt Belgische leerling-bestuurders bij het verkennen van oefenroutes rond officiële examencentra in Vlaanderen, Brussel en Wallonië.',
      aboutDisclaimer: 'Enkel ter oefening. Dit zijn voorgestelde oefenroutes, geen officiële examenroutes. Bevestig altijd de details bij het examencentrum.',
      aboutSupport: 'Steun dit project',
      aboutClose: 'Sluiten',
      useMyLocation: 'Vertrek vanaf mijn locatie',
      locationHint: 'Toon de route vanaf waar je bent',
      locationLoading: 'Locatie ophalen…',
      locationActive: 'Huidige locatie wordt gebruikt',
      locationDenied: 'Locatietoegang geweigerd',
      locationUnsupported: 'Locatie niet beschikbaar'
    },
    en: {
      chooseLanguage: 'Choose your language',
      tagline: 'Belgian practice routes',
      searchPlaceholder: 'Search city, region, center, address',
      filterAll: 'All', filterBrussels: 'Brussels', filterFlanders: 'Flanders', filterWallonia: 'Wallonia',
      cities: 'Cities', centers: 'Exam centers', routes: 'Practice routes', back: 'Back',
      noResults: 'No matching cities found.',
      disclaimerShort: 'Practice guidance only. Confirm official exam details with the exam center.',
      disclaimerLong: 'Practice guidance only. These are suggested practice routes and not official exam routes. Always confirm details with the exam center.',
      openMaps: 'Open in Google Maps',
      address: 'Address', operator: 'Operator', phone: 'Phone',
      duration: 'min', distance: 'km', focus: 'Focus', notes: 'Key points',
      cityCount: (n) => `${n} ${n === 1 ? 'city' : 'cities'}`,
      regionFlanders: 'Flanders', regionWallonia: 'Wallonia', regionBrussels: 'Brussels',
      centerCount: (n) => `${n} ${n === 1 ? 'center' : 'centers'}`,
      aboutTitle: 'About ExamRoute',
      aboutVersion: 'Version 1.0',
      aboutText: 'ExamRoute helps Belgian learner drivers explore practice routes around official exam centers — across Flanders, Brussels and Wallonia.',
      aboutDisclaimer: 'Practice guidance only. These are suggested practice routes and not official exam routes. Always confirm details with the exam center.',
      aboutSupport: 'Support this project',
      aboutClose: 'Close',
      useMyLocation: 'Start from my location',
      locationHint: 'Show directions from where you are',
      locationLoading: 'Getting location…',
      locationActive: 'Using current location',
      locationDenied: 'Location access denied',
      locationUnsupported: 'Location unavailable'
    },
    fr: {
      chooseLanguage: 'Choisissez votre langue',
      tagline: 'Itinéraires d\'examen belges',
      searchPlaceholder: 'Ville, région, centre ou adresse',
      filterAll: 'Toutes', filterBrussels: 'Bruxelles', filterFlanders: 'Flandre', filterWallonia: 'Wallonie',
      cities: 'Villes', centers: 'Centres d\'examen', routes: 'Itinéraires de pratique', back: 'Retour',
      noResults: 'Aucune ville trouvée.',
      disclaimerShort: 'À titre indicatif. Confirmez les détails officiels avec le centre d\'examen.',
      disclaimerLong: 'À titre indicatif uniquement. Ce sont des itinéraires de pratique suggérés et non des itinéraires officiels. Confirmez toujours les détails avec le centre d\'examen.',
      openMaps: 'Ouvrir dans Google Maps',
      address: 'Adresse', operator: 'Opérateur', phone: 'Téléphone',
      duration: 'min', distance: 'km', focus: 'Objectif', notes: 'Points clés',
      cityCount: (n) => `${n} ville${n === 1 ? '' : 's'}`,
      regionFlanders: 'Flandre', regionWallonia: 'Wallonie', regionBrussels: 'Bruxelles',
      centerCount: (n) => `${n} centre${n === 1 ? '' : 's'}`,
      aboutTitle: 'À propos d\'ExamRoute',
      aboutVersion: 'Version 1.0',
      aboutText: 'ExamRoute aide les apprentis conducteurs belges à explorer des itinéraires de pratique autour des centres d\'examen officiels — en Flandre, à Bruxelles et en Wallonie.',
      aboutDisclaimer: 'À titre indicatif uniquement. Ce sont des itinéraires de pratique suggérés et non des itinéraires officiels. Confirmez toujours les détails avec le centre d\'examen.',
      aboutSupport: 'Soutenir ce projet',
      aboutClose: 'Fermer',
      useMyLocation: 'Partir depuis ma position',
      locationHint: 'Itinéraire depuis votre position',
      locationLoading: 'Localisation en cours…',
      locationActive: 'Position actuelle utilisée',
      locationDenied: 'Accès à la localisation refusé',
      locationUnsupported: 'Localisation indisponible'
    }
  };

  // ===================== Helpers =====================
  function tri(nl, en, fr) { return { nl, en, fr }; }
  function gmaps(q) { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q); }
  function gmapsPath(path, cityName) {
    if (!path || path.length < 2) return null;
    // Path-style URL: /maps/dir/A/B/C. More tolerant of partial place
    // names (road codes, small streets) than the ?api=1 + waypoints
    // form, and triggers the native Maps app on Android WebView.
    const segments = path.map(p =>
      encodeURIComponent(p + ', ' + cityName).replace(/%20/g, '+')
    );
    return 'https://www.google.com/maps/dir/' + segments.join('/');
  }
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  // ===================== Route flavor system =====================
  // Each flavor provides distinct A/B/C focus + notes + tags that reflect the
  // real driving context (Brussels trams, coastal wind, Ardennes rural, etc.)
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

  // Per-center route overrides. Use this when a center has a known
  // street-by-street practice itinerary worth showing exactly.
  const ROUTE_OVERRIDES = {
    'gent-sdw': {
      city: 'Gent',
      A: {
        path: ['Poortakkerstraat', 'Klenkouterken', 'Steenaardestraat', 'Beukenlaan', 'Stormvogelstraat', 'B402', 'Poortakkerstraat'],
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
    }
  };

  // Deterministic per-center variance so two centers with the same flavor
  // still show different stats.
  function variance(centerId, route, base, spread) {
    const h = hashStr(centerId + route);
    const offset = (h % (spread * 2 + 1)) - spread;
    return Math.max(1, base + offset);
  }

  function makeRoutes(centerId, address, cityName) {
    const flavorKey = CENTER_FLAVORS[centerId] || 'flemish-rural';
    const f = FLAVORS[flavorKey];
    const diffMap = {
      A: tri('Gemiddeld', 'Medium', 'Moyen'),
      B: tri('Makkelijk', 'Easy', 'Facile'),
      C: tri('Moeilijk', 'Hard', 'Difficile')
    };
    const base = {
      A: { dist: 12, dur: 35, distSpread: 3, durSpread: 6 },
      B: { dist: 6, dur: 25, distSpread: 2, durSpread: 5 },
      C: { dist: 24, dur: 45, distSpread: 5, durSpread: 9 }
    };
    const overrides = ROUTE_OVERRIDES[centerId] || {};
    return ['A', 'B', 'C'].map(letter => {
      const o = overrides[letter] || {};
      const path = o.path || null;
      const mapsUrl = (path && gmapsPath(path, overrides.city || cityName)) || gmaps(address + ', ' + cityName);
      return {
        id: centerId + '-' + letter.toLowerCase(),
        label: tri('Route ' + letter, 'Route ' + letter, 'Itinéraire ' + letter),
        focus: f[letter].focus,
        difficulty: diffMap[letter],
        distanceKm: o.distanceKm != null ? o.distanceKm : variance(centerId, letter, base[letter].dist, base[letter].distSpread),
        durationMin: o.durationMin != null ? o.durationMin : variance(centerId, letter, base[letter].dur, base[letter].durSpread),
        image: letter,
        imageUrl: o.imageUrl || null,
        tags: f[letter].tags,
        notes: f[letter].notes,
        path: path,
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

  // ===================== Data =====================
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

  // ===================== State =====================
  const state = {
    lang: 'en',
    region: 'all',
    query: '',
    screen: 'language',
    selectedCityId: null,
    selectedCenterId: null,
    useLocation: false,
    userLocation: null,
    locationStatus: 'idle' // idle | loading | granted | denied | unsupported
  };

  function buildRouteUrl(route, center, cityName) {
    const stops = [];
    if (state.userLocation) {
      stops.push(state.userLocation.lat.toFixed(6) + ',' + state.userLocation.lng.toFixed(6));
    }
    if (route.path && route.path.length >= 2) {
      route.path.forEach(p => stops.push(p + ', ' + cityName));
    } else {
      stops.push(center.address);
    }
    if (stops.length < 2) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(stops[0] || center.address);
    }
    const segments = stops.map(s => encodeURIComponent(s).replace(/%20/g, '+'));
    return 'https://www.google.com/maps/dir/' + segments.join('/');
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      state.locationStatus = 'unsupported';
      state.useLocation = false;
      const tgl = $('#useLocationToggle');
      if (tgl) tgl.checked = false;
      updateLocationUI();
      return;
    }
    state.locationStatus = 'loading';
    state.locationError = null;
    updateLocationUI();
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.locationStatus = 'granted';
        state.locationError = null;
        updateLocationUI();
        refreshRouteUrls();
      },
      err => {
        state.userLocation = null;
        state.locationStatus = 'denied';
        // PositionError.code: 1=denied, 2=unavailable, 3=timeout
        const codeMap = { 1: 'PERMISSION_DENIED', 2: 'POSITION_UNAVAILABLE', 3: 'TIMEOUT' };
        state.locationError = (codeMap[err && err.code] || 'ERROR') + (err && err.message ? ': ' + err.message : '');
        state.useLocation = false;
        const tgl = $('#useLocationToggle');
        if (tgl) tgl.checked = false;
        updateLocationUI();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function updateLocationUI() {
    const el = $('#locStatus');
    if (!el) return;
    el.classList.toggle('loc-status-active', state.locationStatus === 'granted');
    el.classList.toggle('loc-status-error', state.locationStatus === 'denied' || state.locationStatus === 'unsupported');

    if (state.locationStatus === 'granted' && state.userLocation) {
      el.removeAttribute('data-i18n');
      const lat = state.userLocation.lat.toFixed(4);
      const lng = state.userLocation.lng.toFixed(4);
      el.textContent = t().locationActive + ' · ' + lat + ', ' + lng;
      return;
    }
    if (state.locationStatus === 'denied' && state.locationError) {
      el.removeAttribute('data-i18n');
      el.textContent = t().locationDenied + ' · ' + state.locationError;
      return;
    }
    const map = {
      loading: 'locationLoading',
      denied: 'locationDenied',
      unsupported: 'locationUnsupported',
      idle: 'locationHint'
    };
    const key = map[state.locationStatus] || 'locationHint';
    el.setAttribute('data-i18n', key);
    el.textContent = t()[key];
  }

  function refreshRouteUrls() {
    if (state.screen !== 'center') return;
    const city = CITIES.find(c => c.id === state.selectedCityId);
    if (!city) return;
    const center = city.centers.find(c => c.id === state.selectedCenterId);
    if (!center) return;
    const cards = $$('.route-card');
    cards.forEach((card, idx) => {
      const route = center.routes[idx];
      if (!route) return;
      const btn = card.querySelector('.maps-btn');
      if (btn) btn.setAttribute('href', buildRouteUrl(route, center, city.name.nl));
    });
  }

  // ===================== DOM helpers =====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  function t() { return I18N[state.lang]; }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const v = t()[key];
      if (typeof v === 'string') el.textContent = v;
    });
    $$('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const v = t()[key];
      if (typeof v === 'string') el.setAttribute('placeholder', v);
    });
    const currentLangEl = $('#currentLang');
    if (currentLangEl) currentLangEl.textContent = state.lang.toUpperCase();
    const searchInput = $('#searchInput');
    if (searchInput) searchInput.value = state.query;
  }

  // ===================== Hash routing =====================
  // URL hash gives us:
  //   - Working WebView/browser back button
  //   - Shareable deep links to a specific city or center
  // Hashes: #/, #/home, #/city/:cityId, #/city/:cityId/center/:centerId
  let suppressHashHandler = false;

  function buildHash(screen) {
    if (screen === 'language') return '#/';
    if (screen === 'home') return '#/home';
    if (screen === 'city') return '#/city/' + encodeURIComponent(state.selectedCityId || '');
    if (screen === 'center') return '#/city/' + encodeURIComponent(state.selectedCityId || '') + '/center/' + encodeURIComponent(state.selectedCenterId || '');
    return '#/';
  }

  function navigate(screen, opts) {
    opts = opts || {};
    if (opts.cityId !== undefined) state.selectedCityId = opts.cityId;
    if (opts.centerId !== undefined) state.selectedCenterId = opts.centerId;
    const newHash = buildHash(screen);
    suppressHashHandler = true;
    if (opts.replace) {
      history.replaceState(null, '', newHash);
    } else if (location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }
    suppressHashHandler = false;
    renderForScreen(screen);
  }

  function renderForScreen(screen) {
    state.screen = screen;
    if (screen === 'home') {
      renderHome();
    } else if (screen === 'city') {
      if (!renderCity(state.selectedCityId)) { navigate('home', { replace: true }); return; }
    } else if (screen === 'center') {
      if (!renderCenter(state.selectedCityId, state.selectedCenterId)) { navigate('home', { replace: true }); return; }
    }
    showScreen(screen);
  }

  function parseHash() {
    const h = (location.hash || '').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    // parts: ['city', cityId, 'center', centerId] or ['city', cityId] or ['home'] or []
    if (parts.length === 0) return { screen: state.lang ? 'home' : 'language' };
    if (parts[0] === 'home') return { screen: 'home' };
    if (parts[0] === 'city' && parts[1]) {
      if (parts[2] === 'center' && parts[3]) {
        return { screen: 'center', cityId: decodeURIComponent(parts[1]), centerId: decodeURIComponent(parts[3]) };
      }
      return { screen: 'city', cityId: decodeURIComponent(parts[1]) };
    }
    return { screen: 'home' };
  }

  function onHashChange() {
    if (suppressHashHandler) return;
    const parsed = parseHash();
    // If user lands deep without picking a language yet, still allow it
    // (we have a stored or default language already applied at boot).
    if (parsed.screen === 'language') { showScreen('language'); state.screen = 'language'; return; }
    if (parsed.cityId !== undefined) state.selectedCityId = parsed.cityId;
    if (parsed.centerId !== undefined) state.selectedCenterId = parsed.centerId;
    renderForScreen(parsed.screen);
  }

  function showScreen(name) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const map = { language: 'screen-language', home: 'screen-home', city: 'screen-city', center: 'screen-center' };
    const el = document.getElementById(map[name]);
    if (el) el.classList.add('active');
    const fab = $('#aboutFab');
    if (fab) fab.hidden = (name === 'language');
    window.scrollTo(0, 0);
  }

  function openAbout() {
    const m = $('#aboutModal');
    if (!m) return;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('open'));
    document.body.style.overflow = 'hidden';
  }
  function closeAbout() {
    const m = $('#aboutModal');
    if (!m) return;
    m.classList.remove('open');
    setTimeout(() => { m.hidden = true; }, 180);
    document.body.style.overflow = '';
  }

  // ===================== Rendering =====================
  function regionLabel(region) {
    if (region === 'flanders') return t().regionFlanders;
    if (region === 'wallonia') return t().regionWallonia;
    return t().regionBrussels;
  }
  function difficultyClass(diff) {
    const en = diff.en.toLowerCase();
    if (en.includes('easy')) return 'easy';
    if (en.includes('hard')) return 'hard';
    return 'medium';
  }
  function matchesQuery(city) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [city.name.nl, city.name.en, city.name.fr, city.region, regionLabel(city.region), city.province.nl, city.province.en, city.province.fr];
    city.centers.forEach(c => haystack.push(c.name.nl, c.name.en, c.name.fr, c.address, c.operator));
    return haystack.join(' | ').toLowerCase().includes(q);
  }
  function getFilteredCities() {
    return CITIES.filter(c => {
      if (state.region !== 'all' && c.region !== state.region) return false;
      if (!matchesQuery(c)) return false;
      return true;
    });
  }

  function renderHome() {
    const grid = $('#cityGrid');
    const empty = $('#cityEmpty');
    const count = $('#cityCount');
    const list = getFilteredCities();
    grid.innerHTML = '';
    list.forEach((city, index) => {
      const card = document.createElement('button');
      card.className = 'card city-card';
      card.setAttribute('data-city-id', city.id);
      const cityName = city.name[state.lang];
      const p = paletteFor(city.id, index);
      const accentStyle = `background:${p.accent}`;
      const badgeStyle = `background:${p.bg};color:${p.text};border-color:${p.border}`;
      card.innerHTML = `
        <div class="city-accent" style="${accentStyle}"></div>
        <div class="city-badge" style="${badgeStyle}">${escapeHtml(cityInitial(cityName))}</div>
        <div class="city-body">
          <h3 class="city-name">${escapeHtml(cityName)}</h3>
          <p class="city-meta">${escapeHtml(city.province[state.lang])}</p>
        </div>
        <div class="card-foot">
          <span class="region-pill ${city.region}">${escapeHtml(regionLabel(city.region))}</span>
          <span class="center-count-pill">${escapeHtml(t().centerCount(city.centers.length))}</span>
        </div>
      `;
      card.addEventListener('click', () => navigate('city', { cityId: city.id }));
      grid.appendChild(card);
    });
    count.textContent = t().cityCount(list.length);
    empty.hidden = list.length !== 0;
  }

  function renderCity(cityId) {
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return false;
    $('#cityName').textContent = city.name[state.lang];
    $('#cityMeta').textContent = `${regionLabel(city.region)} · ${city.province[state.lang]}`;
    const list = $('#centerList');
    list.innerHTML = '';
    const p = paletteFor(city.id, 0);
    city.centers.forEach(center => {
      const item = document.createElement('div');
      item.className = 'center-card';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      const headerStyle = `background:${p.bg};border-color:${p.border}`;
      const badgeStyle = `background:${p.accent};color:#fff`;
      const iconStyle = `color:${p.text}`;
      item.innerHTML = `
        <div class="center-header" style="${headerStyle}">
          <div class="center-pin" style="${iconStyle}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
          </div>
          <div class="center-route-badge" style="${badgeStyle}">
            <strong>${center.routes.length}</strong>
            <span>${escapeHtml(t().routes.toLowerCase())}</span>
          </div>
        </div>
        <div class="center-body">
          <h3 class="center-name">${escapeHtml(center.name[state.lang])}</h3>
          <p class="center-sub">
            <svg class="row-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
            <span>${escapeHtml(center.address)}</span>
          </p>
          <div class="center-chips">
            <span class="chip chip-operator">${escapeHtml(center.operator)}</span>
            <a class="chip chip-phone" href="tel:${escapeHtml(center.phone.replace(/\s+/g,''))}" onclick="event.stopPropagation()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 15.5a12.5 12.5 0 0 1-3.93-.63 1 1 0 0 0-1 .25l-2.2 2.2a15 15 0 0 1-6.59-6.59l2.2-2.2a1 1 0 0 0 .25-1A12.5 12.5 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1A17 17 0 0 0 20 21a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"/></svg>
              ${escapeHtml(center.phone)}
            </a>
          </div>
        </div>
        <div class="center-cta" style="color:${p.accent}">
          <span>${escapeHtml(t().routes)}</span>
          <span class="cta-arrow">›</span>
        </div>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // let tel: link fire
        navigate('center', { cityId: city.id, centerId: center.id });
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('center', { cityId: city.id, centerId: center.id });
        }
      });
      list.appendChild(item);
    });
    return true;
  }

  function renderCenter(cityId, centerId) {
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return false;
    const center = city.centers.find(c => c.id === centerId);
    if (!center) return false;
    $('#centerName').textContent = center.name[state.lang];
    $('#centerMeta').textContent = `${city.name[state.lang]} · ${regionLabel(city.region)}`;
    const tgl = $('#useLocationToggle');
    if (tgl) tgl.checked = state.useLocation && state.locationStatus === 'granted';
    updateLocationUI();
    const list = $('#routeList');
    list.innerHTML = '';
    center.routes.forEach(route => {
      const card = document.createElement('div');
      card.className = 'route-card';
      const dc = difficultyClass(route.difficulty);
      card.innerHTML = `
        <div class="route-image${route.imageUrl ? ' has-photo' : ''}">
          ${route.imageUrl ? `<img src="${escapeHtml(route.imageUrl)}" alt="${escapeHtml(route.label[state.lang])}" loading="lazy" />` : routeIllustration(route.image)}
          <span class="route-label">${escapeHtml(route.label[state.lang])}</span>
          <span class="route-difficulty ${dc}">${escapeHtml(route.difficulty[state.lang])}</span>
        </div>
        <div class="route-body">
          <h3 class="route-focus">${escapeHtml(route.focus[state.lang])}</h3>
          <div class="route-stats">
            <span class="route-stat"><strong>${route.durationMin}</strong> ${escapeHtml(t().duration)}</span>
            <span class="route-stat"><strong>${route.distanceKm}</strong> ${escapeHtml(t().distance)}</span>
          </div>
          <div class="route-tags">
            ${route.tags.map(tag => `<span class="route-tag">${escapeHtml(tag[state.lang])}</span>`).join('')}
          </div>
          ${route.path ? `<ol class="route-path">${route.path.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ol>` : ''}
          <div class="route-notes">
            <ul>${route.notes.map(n => `<li>${escapeHtml(n[state.lang])}</li>`).join('')}</ul>
          </div>
          <a class="maps-btn" href="${buildRouteUrl(route, center, city.name.nl)}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
            ${escapeHtml(t().openMaps)}
          </a>
        </div>
      `;
      list.appendChild(card);
    });
    return true;
  }

  function routeIllustration(kind) {
    if (kind === 'A') {
      return `<svg viewBox="0 0 300 120" preserveAspectRatio="none">
        <defs><linearGradient id="gA" x1="0" x2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset="1" stop-color="#333"/></linearGradient></defs>
        <rect width="300" height="120" fill="url(#gA)"/>
        <g stroke="#fcbf1e" stroke-width="3" fill="none" stroke-linecap="round">
          <path d="M0,90 Q60,90 80,70 T140,60 T220,70 T300,55"/>
          <path d="M0,100 Q60,100 80,80 T140,70 T220,80 T300,65" opacity="0.4"/>
        </g>
        <g fill="#d62828"><circle cx="80" cy="70" r="4"/><circle cx="220" cy="70" r="4"/></g>
        <g fill="#fff" opacity="0.85"><rect x="40" y="30" width="14" height="22" rx="2"/><rect x="58" y="36" width="14" height="16" rx="2"/><rect x="240" y="26" width="14" height="26" rx="2"/></g>
      </svg>`;
    }
    if (kind === 'B') {
      return `<svg viewBox="0 0 300 120" preserveAspectRatio="none">
        <rect width="300" height="120" fill="#1a1a1a"/>
        <g stroke="#fcbf1e" stroke-width="2" fill="none" stroke-dasharray="6 6">
          <rect x="40" y="40" width="60" height="40" rx="3"/>
          <rect x="120" y="40" width="60" height="40" rx="3"/>
          <rect x="200" y="40" width="60" height="40" rx="3"/>
        </g>
        <g fill="#d62828"><rect x="130" y="48" width="40" height="24" rx="3"/></g>
        <g stroke="#fff" stroke-width="1.5" opacity="0.4"><line x1="0" y1="20" x2="300" y2="20"/><line x1="0" y1="100" x2="300" y2="100"/></g>
      </svg>`;
    }
    return `<svg viewBox="0 0 300 120" preserveAspectRatio="none">
      <rect width="300" height="120" fill="#111"/>
      <g stroke="#fff" stroke-width="1" opacity="0.15"><line x1="0" y1="40" x2="300" y2="40"/><line x1="0" y1="60" x2="300" y2="60"/><line x1="0" y1="80" x2="300" y2="80"/></g>
      <path d="M-10,80 C50,30 120,110 180,60 C220,30 260,70 310,40" stroke="#fcbf1e" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M-10,80 C50,30 120,110 180,60 C220,30 260,70 310,40" stroke="#d62828" stroke-width="1" fill="none" stroke-dasharray="4 6" opacity="0.7"/>
      <circle cx="20" cy="76" r="5" fill="#fff"/><circle cx="280" cy="44" r="5" fill="#d62828"/>
    </svg>`;
  }

  // City color palette — deterministic per city id so colors stay stable.
  const CITY_PALETTES = [
    { accent: '#fcbf1e', bg: '#fff3c4', text: '#5e4a00', border: '#f1d77b' }, // yellow
    { accent: '#7cb342', bg: '#e6f4d6', text: '#2e4d10', border: '#bcdb95' }, // green
    { accent: '#42a5f5', bg: '#d8ecfb', text: '#0d3a5e', border: '#9ec9eb' }, // sky
    { accent: '#ef6c5e', bg: '#fde0dc', text: '#6b1d15', border: '#f0b5ad' }, // coral
    { accent: '#ab7df0', bg: '#ece0fa', text: '#3a1f6b', border: '#c8b2ea' }, // lavender
    { accent: '#26a69a', bg: '#d4f0ed', text: '#0d4540', border: '#9dd2cc' }, // teal
    { accent: '#ec407a', bg: '#fbdce8', text: '#6b1a3a', border: '#eeb1c8' }, // pink
    { accent: '#ff8a3d', bg: '#fde4cf', text: '#6b3010', border: '#f1be91' }, // orange
    { accent: '#5c6bc0', bg: '#dde0f1', text: '#1f266b', border: '#a8b0db' }, // indigo
    { accent: '#8d6e63', bg: '#e7ddd6', text: '#3e2a1f', border: '#bfa899' }, // brown
    { accent: '#00838f', bg: '#cfe9ec', text: '#003c44', border: '#92c9d0' }, // dark cyan
    { accent: '#c0ca33', bg: '#eef0c4', text: '#3e421a', border: '#d4d98c' }  // lime
  ];
  // Hard-pinned colors for specific cities — overrides the cycle.
  const CITY_COLOR_PINS = {
    gent: 5 // teal
  };
  function paletteFor(cityId, index) {
    if (CITY_COLOR_PINS[cityId] != null) return CITY_PALETTES[CITY_COLOR_PINS[cityId]];
    return CITY_PALETTES[index % CITY_PALETTES.length];
  }

  function cityInitial(name) {
    const cleaned = name.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    return cleaned ? cleaned[0].toUpperCase() : '·';
  }
  function initials(name) {
    const parts = name.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ===================== Language persistence =====================
  function loadLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) { /* localStorage unavailable */ }
    return null;
  }
  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  // ===================== Event wiring =====================
  function init() {
    const saved = loadLang();
    const hasLang = !!saved;
    state.lang = saved || 'en';
    applyI18n();

    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.getAttribute('data-lang');
        saveLang(state.lang);
        applyI18n();
        navigate('home');
      });
    });

    $('#langToggle').addEventListener('click', () => {
      const order = ['nl', 'en', 'fr'];
      state.lang = order[(order.indexOf(state.lang) + 1) % order.length];
      saveLang(state.lang);
      applyI18n();
      if (state.screen === 'home') renderHome();
      if (state.screen === 'city') renderCity(state.selectedCityId);
      if (state.screen === 'center') renderCenter(state.selectedCityId, state.selectedCenterId);
    });

    $('#searchInput').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderHome();
    });

    $$('#regionFilters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#regionFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.region = btn.getAttribute('data-region');
        renderHome();
      });
    });

    // Back buttons: use history.back so the URL hash stays in sync and the
    // hardware/Android back button also works the same way.
    $$('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (history.length > 1) history.back();
        else navigate('home', { replace: true });
      });
    });

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);

    // Rebuild the Maps URL at click time so we always use the latest
    // state.userLocation, even if it arrived after the page rendered.
    $('#routeList').addEventListener('click', (e) => {
      const btn = e.target.closest('.maps-btn');
      if (!btn) return;
      const card = btn.closest('.route-card');
      if (!card) return;
      const idx = Array.from(card.parentNode.children).indexOf(card);
      const city = CITIES.find(c => c.id === state.selectedCityId);
      if (!city) return;
      const center = city.centers.find(c => c.id === state.selectedCenterId);
      if (!center) return;
      const route = center.routes[idx];
      if (!route) return;
      btn.href = buildRouteUrl(route, center, city.name.nl);
    });

    $('#useLocationToggle').addEventListener('change', (e) => {
      state.useLocation = e.target.checked;
      if (state.useLocation) {
        requestLocation();
      } else {
        state.userLocation = null;
        state.locationStatus = 'idle';
        updateLocationUI();
        refreshRouteUrls();
      }
    });

    $('#aboutFab').addEventListener('click', openAbout);
    $$('#aboutModal [data-close]').forEach(el => el.addEventListener('click', closeAbout));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#aboutModal').hidden) closeAbout();
    });

    // Initial route decision
    const parsed = parseHash();
    if (parsed.screen === 'language' || (!hasLang && parsed.screen === 'home' && !location.hash)) {
      // No saved language and no deep link → show splash
      if (!hasLang) {
        showScreen('language');
        state.screen = 'language';
        history.replaceState(null, '', '#/');
        return;
      }
    }
    // Language is known (or deep link present): go to the resolved screen
    if (parsed.cityId !== undefined) state.selectedCityId = parsed.cityId;
    if (parsed.centerId !== undefined) state.selectedCenterId = parsed.centerId;
    const target = parsed.screen === 'language' ? 'home' : parsed.screen;
    navigate(target, { replace: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
