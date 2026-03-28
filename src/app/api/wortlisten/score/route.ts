import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/utils/supabase/server";

// Multi-anchor HF descriptions — 4 focused semantic clusters per Handlungsfeld.
// Scoring: embed each anchor individually, take MAX cosine across anchors per HF.
// This eliminates semantic bleed from co-embedding unrelated concepts.
const HF_ANCHORS: Record<string, string[]> = {
  DEU: [
    "Sprachkurs, Integrationskurs, Volkshochschule, Sprachschule, Klassenraum, Kursstufe, Intensivkurs, Abendkurs, Alphabetisierungskurs, Unterrichtsstunde, Kursteilnehmer, Lehrkraft, Kursleiter, Kursbescheinigung, Teilnahmebescheinigung, Einstufungstest, Sprachniveau, Kursanmeldung",
    "Lehrbuch, Arbeitsheft, Arbeitsblatt, Wörterbuch, Vokabelheft, Lern-App, Grammatiktabelle, Kopfhörer, Whiteboard, Tafel, Beamer, Karteikarte, Lückentext, Hörtext, Lesetext, Übungsbuch, Online-Plattform",
    "Vokabel, Grammatik, Aussprache, Wortschatz, Satzbau, Konjugation, Deklination, Rechtschreibung, Hörverstehen, Leseverstehen, buchstabieren, übersetzen, nachschlagen, nachsprechen, Diktat, Textproduktion, Sprechübung, Dialogübung, Rollenspiel",
    "Sprachprüfung, Deutschtest, DTZ, Telc, Goethe-Zertifikat, TestDaF, A1, A2, B1, B2, C1, Prüfungsvorbereitung, Prüfungstermin, Modeltest, Prüfungsteil, bestehen, durchfallen, Zertifikat, Sprachnachweis, Prüfungsgebühr",
  ],
  GES: [
    "Hausarzt, Facharzt, Kinderarzt, Zahnarzt, Frauenarzt, Sprechstunde, Arztpraxis, Wartezimmer, Termin, Überweisung, Krankenhaus, Notaufnahme, Untersuchung, Diagnose, Blutdruck, Blutabnahme, Röntgen, Ultraschall, Rezept, Krankmeldung, Arbeitsunfähigkeitsbescheinigung",
    "Fieber, Husten, Schnupfen, Kopfschmerzen, Bauchschmerzen, Rückenschmerzen, Halsschmerzen, Übelkeit, Durchfall, Erbrechen, Schwindel, Allergie, Entzündung, Infektion, Erkältung, Grippe, Hautausschlag, Verletzung, Wunde, Schmerzen, Beschwerden, chronisch, akut",
    "Tablette, Salbe, Tropfen, Hustensaft, Antibiotikum, Schmerzmittel, Impfung, Impfpass, Nebenwirkung, Dosierung, Beipackzettel, Apotheke, rezeptfrei, rezeptpflichtig, Therapie, Physiotherapie, Psychotherapie, Heilmittel, Verband, Pflaster",
    "Krankenversicherung, Krankenkasse, Gesundheitskarte, Versichertennummer, Kassenbeitrag, gesetzlich versichert, privat versichert, Zuzahlung, Bonusheft, Vorsorgeuntersuchung, Impfkalender, Krankengeld, Familienversicherung, Pflegeversicherung",
    "Kopf, Hals, Nase, Ohr, Auge, Mund, Zahn, Schulter, Arm, Ellbogen, Hand, Finger, Brust, Rücken, Bauch, Hüfte, Bein, Knie, Fuß, Zehe, Haut, Knochen, Gelenk, Muskel, Herz, Lunge, Magen, Niere, Leber",
  ],
  SIC: [
    "Notruf, Rettungswagen, Feuerwehr, Notarzt, Rettungsdienst, Notaufnahme, Erste Hilfe, Verbandskasten, stabile Seitenlage, Wiederbelebung, Defibrillator, Unfallstelle, Rettungsgasse, Blaulicht, Sirene, Notrufnummer, Leitstelle, Einsatz, bergen, reanimieren",
    "Polizei, Polizeirevier, Polizeibeamter, Streifenwagen, Diebstahl, Einbruch, Überfall, Betrug, Taschendieb, Anzeige erstatten, Zeugenaussage, Protokoll, Personalausweis, Verdächtiger, Tatort, Ermittlung, Opferschutz, Straftat, Vandalismus",
    "Brandmelder, Rauchmelder, Feuerlöscher, Fluchtweg, Notausgang, Sammelplatz, Evakuierung, Hochwasser, Unwetter, Sturmwarnung, Katastrophenschutz, Zivilschutz, Warnsignal, Warn-App, Schutzraum, Sandsack, Stromausfall, Blackout, Trinkwasservorrat, Notgepäck",
    "Verkehrsunfall, Autounfall, Unfallbericht, Unfallprotokoll, Schadensfall, Schadensmeldung, Haftpflicht, Pannenhilfe, Warndreieck, Warnweste, Fahrerflucht, Sachschaden, Personenschaden, Versicherungsnummer, Unfallgegner, Schadenregulierung",
  ],
  FAM: [
    "Ehepartner, Ehefrau, Ehemann, Lebenspartner, Schwiegermutter, Schwiegervater, Schwager, Schwägerin, Großeltern, Enkel, Enkelin, Cousin, Cousine, Tante, Onkel, Nichte, Neffe, Stiefkind, Patchworkfamilie, Alleinerziehende, Mehrgenerationenhaushalt",
    "Standesamt, Trauung, Eheschließung, Heiratsurkunde, Eheurkunde, Familienname, Namensänderung, Ehevertrag, Scheidung, Trennung, Sorgerecht, Unterhalt, Aufenthaltsrecht, Familiennachzug, Verlobung, eingetragene Lebenspartnerschaft, Trauzeugin",
    "Haushalt, Hausarbeit, Wäsche waschen, bügeln, staubsaugen, aufräumen, kochen, Einkaufsliste, Familienfeier, Geburtstag, Weihnachten, Familienfoto, Erziehung, Taschengeld, Familienurlaub, Elternzeit, Mutterschutz, Elterngeld, Kindergeld",
    "Eheberatung, Familienberatung, Paartherapie, Mediation, Streit, Versöhnung, Kommunikation, Kompromiss, häusliche Gewalt, Frauenhaus, Gewaltschutz, Jugendamt, Umgangsrecht, Besuchsrecht, Familienrecht, Beziehungskrise",
    "Schwangerschaft, schwanger, Geburt, Entbindung, Hebamme, Neugeborenes, Baby, Kleinkind, stillen, Windel, wickeln, Kinderwagen, Babyschale, Kinderbett, Babyflasche, Schnuller, Babynahrung, Säugling, Wochenbett, Mutterpassheft",
  ],
  KIN: [
    "Kinderkrippe, Kindergarten, Kita, Kindertagesstätte, Tagesmutter, Betreuungsplatz, Kitaplatz, Eingewöhnung, Erzieher, Erzieherin, Vorschule, Spielgruppe, Betreuungszeiten, Abholzeit, Bringzeit, Elternbeitrag, Kitagebühr, Betreuungsgutschein",
    "Grundschule, Hauptschule, Realschule, Gymnasium, Gesamtschule, Förderschule, Schulpflicht, Einschulung, Schultüte, Schulanmeldung, Schulwechsel, Übertritt, Probeunterricht, Ganztagsschule, Hort, Nachmittagsbetreuung, Schuljahr, Halbjahr, Schulferien, Klassenstufe",
    "Zeugnis, Schulnote, Klassenarbeit, Hausaufgabe, Stundenplan, Schulfach, Mathematik, Sachkunde, Religionsunterricht, Sportunterricht, Schulranzen, Federmäppchen, Schulheft, Klassenlehrerin, Fachlehrer, Nachhilfe, Förderunterricht, Lernstandserhebung, Versetzung, sitzenbleiben",
    "Elternabend, Elternsprechtag, Elternbrief, Elternbeirat, Schulleitung, Klassenpflegschaft, Entschuldigung, Schulordnung, Beurlaubung, Schulsozialarbeit, Schulpsychologe, Inklusion, Förderbedarf, Lernbehinderung, Schulbegleiter, Mitteilungsheft",
    "Spielzeug, Puppe, Teddy, Baustein, Lego, Playmobil, Malstift, Buntstift, Kinderbuch, Bilderbuch, Bastelschere, Knetmasse, Sandkasten, Schaukel, Rutsche, Trampolin, Dreirad, Roller, Kreide, Puzzlespiel",
  ],
  SOZ: [
    "Freundeskreis, Bekanntenkreis, Nachbarschaft, Kontakt knüpfen, kennenlernen, verabreden, Stammtisch, Treffpunkt, Gemeinschaft, Zusammenhalt, Einladung, Besuch, Gastfreundschaft, Geselligkeit, Zugehörigkeit, Vertrauensperson, Bezugsperson",
    "Verein, Mitgliedschaft, Vereinsbeitrag, Vereinsregister, Sportverein, Kulturverein, Elternverein, Ehrenamt, ehrenamtlich, Freiwilligenarbeit, Engagement, Nachbarschaftshilfe, Tafel, Kleiderkammer, Sozialkaufhaus, Gemeinnützigkeit, Spende, Helferkreis",
    "Integrationslotse, Willkommenslotse, Patenschaft, Tandempartner, Sprachtandem, Begegnungscafé, Stadtteilzentrum, Mehrgenerationenhaus, Quartierstreff, Nachbarschaftszentrum, interkulturell, Willkommenskultur, Austauschprogramm, Teilhabe, Mitwirkung, Partizipation",
    "Einsamkeit, Isolation, Heimweh, Sprachbarriere, Kulturschock, Ausgrenzung, Diskriminierung, Vorurteil, Anschluss finden, Kontaktschwierigkeiten, Hilfsangebot, Selbsthilfegruppe, Gesprächskreis, Seelsorge, Krisentelefon, Sozialarbeiter",
  ],
  BER: [
    "Beratungsstelle, Migrationsberatung, Sozialberatung, Schuldnerberatung, Suchtberatung, Schwangerschaftsberatung, Verbraucherberatung, Rechtsberatung, Beratungsgespräch, Sprechstunde, Erstberatung, Terminvereinbarung, Anlaufstelle, Beratungsangebot, kostenlos, vertraulich, mehrsprachig",
    "Sozialleistung, Sozialhilfe, Wohngeld, Bildungspaket, Bildungsgutschein, Leistungsbescheid, Antragstellung, Antragsformular, Bewilligungsbescheid, Ablehnungsbescheid, Widerspruch, Bescheid, Leistungsbezug, Bedürftigkeit, Einkommensnachweis, Hilfebedürftigkeit, Regelleistung",
    "Bürgergeld, Jobcenter, Arbeitsvermittlung, Eingliederungsvereinbarung, Maßnahme, Förderprogramm, Weiterbildungsgutschein, Sachbearbeiter, Fallmanager, Integrationsfachkraft, Mitwirkungspflicht, Sanktion, Meldetermin, Kosten der Unterkunft, Mehrbedarf",
    "Caritas, Diakonie, AWO, Deutsches Rotes Kreuz, Wohlfahrtsverband, Flüchtlingshilfe, Pro Asyl, Frauenberatung, Männerberatung, Telefonseelsorge, Krisenintervention, Notunterkunft, Obdachlosenhilfe, Tafelladen, Kleiderkammer, Sachspende, Spendenquittung",
  ],
  EIN: [
    "Supermarkt, Discounter, Drogerie, Bäckerei, Metzgerei, Wochenmarkt, Einkaufszentrum, Kaufhaus, Fachgeschäft, Biomarkt, Reformhaus, Kiosk, Flohmarkt, Secondhandladen, Ladenöffnungszeiten, Filiale, Einkaufsstraße",
    "Kasse, Kassenbon, Quittung, Einkaufswagen, Einkaufstüte, Pfand, Pfandflasche, Sonderangebot, Rabatt, Schnäppchen, Preisvergleich, Stückpreis, Grundpreis, Mehrwertsteuer, Barzahlung, Kartenzahlung, kontaktlos bezahlen, Selbstbedienungskasse, Treuepunkte",
    "Onlineshop, Warenkorb, Bestellung, Lieferung, Versandkosten, Paketdienst, Sendungsverfolgung, Liefertermin, Packstation, Rücksendung, Umtausch, Widerrufsrecht, Rückgaberecht, Reklamation, Garantie, Gewährleistung, Kundenbewertung, Produktrezension",
    "Verbraucherzentrale, Verbraucherrecht, Preisauszeichnung, Mindesthaltbarkeitsdatum, Verfallsdatum, Produktrückruf, Mogelpackung, Irreführung, Kleingedrucktes, Allgemeine Geschäftsbedingungen, Schlichtungsstelle, Gewährleistungsfrist, Kaufvertrag, Widerrufsfrist",
    "Lebensmittel, Obst, Gemüse, Fleisch, Milch, Brot, Getränke, Tiefkühlkost, Konserven, Reinigungsmittel, Waschmittel, Körperpflegeprodukte, Kleidung, Schuhe, Elektronik, Haushaltsartikel, Spielzeug, Bücher, Medikamente kaufen",
  ],
  ERN: [
    "Obst, Gemüse, Fleisch, Geflügel, Fisch, Reis, Nudeln, Kartoffel, Brot, Brötchen, Milch, Käse, Joghurt, Butter, Ei, Mehl, Zucker, Salz, Pfeffer, Gewürz, Olivenöl, Hülsenfrucht, Tiefkühlkost, Konserve, Vollkornprodukt",
    "Rezept, Zutat, Zubereitungszeit, schneiden, schälen, rühren, braten, kochen, backen, dünsten, grillen, würzen, abschmecken, Pfanne, Topf, Backblech, Auflaufform, Schneebesen, Küchenwaage, Mixer, Backrohr, Herdplatte, Mikrowelle",
    "vegetarisch, vegan, glutenfrei, laktosefrei, halal, koscher, Lebensmittelunverträglichkeit, Allergen, Nährwert, Kalorien, Ballaststoff, Vitamin, Eiweiß, Kohlenhydrat, Fett, Ernährungsberatung, Ernährungspyramide, Nahrungsergänzungsmittel, Diät, Übergewicht",
    "Restaurant, Imbiss, Mensa, Kantine, Speisekarte, Tagesgericht, Mittagstisch, Vorspeise, Hauptgericht, Nachspeise, Getränkekarte, Bedienung, Trinkgeld, Reservierung, Lieferdienst, Essensbestellung, Mahlzeit, Frühstücksbuffet",
  ],
  WOH: [
    "Mietvertrag, Kaution, Monatsmiete, Nebenkosten, Nebenkostenabrechnung, Warmmiete, Kaltmiete, Betriebskosten, Vermieter, Mieterhöhung, Kündigung, Wohnungsübergabe, Mietrecht, Mietschutzverband",
    "Schlafzimmer, Wohnzimmer, Arbeitszimmer, Badezimmer, Kinderzimmer, Esszimmer, Flur, Diele, Einbauküche, Möbel, Sofa, Kleiderschrank, Bücherregal, Teppich, Vorhang, Lampe, Parkett, Fliesen, einrichten, renovieren",
    "Mehrfamilienhaus, Einfamilienhaus, Reihenhaus, Stockwerk, Erdgeschoss, Dachgeschoss, Keller, Treppenhaus, Aufzug, Hausmeister, Hausverwaltung, Hausordnung, Nachbar, Klingel, Briefkasten, Gemeinschaftsraum",
    "Wohnungssuche, Wohnungsbesichtigung, Immobilienportal, Makler, Wohnungsinserat, Grundriss, Quadratmeter, Wohnlage, einziehen, ausziehen, Umzugskarton, Umzugswagen, ummelden, Einwohnermeldeamt, Anmeldeformular",
    "Fenster, Tür, Wand, Decke, Boden, Treppe, Heizung, Heizkörper, Badewanne, Dusche, Toilette, Waschbecken, Herd, Kühlschrank, Gefrierschrank, Waschmaschine, Trockner, Steckdose, Lichtschalter, Schloss, Schlüssel, Türklingel, Balkon, Terrasse",
  ],
  MOB: [
    "U-Bahn, S-Bahn, Straßenbahn, Bus, Bushaltestelle, Bahnhof, Bahnsteig, Gleis, Fahrplan, Verspätung, Umstieg, Fahrkarte, Einzelfahrkarte, Tageskarte, Monatskarte, Fahrkartenautomat, Entwertung, Schwarzfahren, Fahrscheinkontrolle, Nahverkehrsverbund",
    "Führerschein, Fahrerlaubnis, Fahrschule, Fahrprüfung, Theorieprüfung, Führerscheinstelle, Führerscheinumschreibung, Kfz-Zulassung, Kennzeichen, Fahrzeugschein, Fahrzeugbrief, TÜV, Hauptuntersuchung, Werkstatt, Tankstelle, Parkplatz, Parkhaus, Strafzettel, Bußgeld",
    "Fahrrad, Fahrradweg, Radweg, Fahrradschloss, Fahrradhelm, Fahrradständer, Fahrradlicht, Fahrradklingel, Leihfahrrad, E-Bike, Lastenrad, Fußgängerzone, Zebrastreifen, Ampel, Bürgersteig, Gehweg, Fußweg, Roller, E-Scooter",
    "Fernzug, ICE, IC, Fernbus, Flughafen, Flugticket, Bordkarte, Gepäck, Handgepäck, Sitzplatzreservierung, Zugbindung, BahnCard, Sparpreis, Flexpreis, Reiseauskunft, Fahrplanauskunft, Buchungsbestätigung, Anschluss verpassen, umbuchen",
    "Straße, Autobahn, Bundesstraße, Landstraße, Kreuzung, Einbahnstraße, Vorfahrt, Stau, Verkehr, Umleitung, Spur, Tempolimit, Geschwindigkeit, Blitzer, Überholverbot, Kurve, Verkehrszeichen, Verkehrsschild, Abfahrt, Auffahrt",
  ],
  FIN: [
    "Girokonto, Sparkonto, Kontoauszug, Kontonummer, IBAN, Bankleitzahl, Überweisung, Dauerauftrag, Lastschrift, Gutschrift, Kontostand, Kontoführungsgebühr, Geldautomat, Onlinebanking, PIN, TAN, Bankkarte, Girokarte, Kontoeröffnung",
    "Haftpflichtversicherung, Hausratversicherung, Privathaftpflicht, Kfz-Versicherung, Berufsunfähigkeitsversicherung, Lebensversicherung, Versicherungspolice, Versicherungsbeitrag, Prämie, Selbstbeteiligung, Schadensfall, Versicherungsmakler, Deckungssumme, Versicherungsschutz, kündigen, abschließen",
    "Einkommensteuer, Lohnsteuer, Steuererklärung, Steuernummer, Steuer-ID, Steuerklasse, Finanzamt, Steuerbescheid, Lohnsteuerjahresausgleich, Steuerberater, Freibetrag, Werbungskosten, Kirchensteuer, Solidaritätszuschlag, Steuererleichterung, absetzbar",
    "Kredit, Ratenkredit, Darlehen, Tilgung, Zinssatz, Kreditvertrag, Schufa, Schufa-Auskunft, Bonität, Schulden, Überschuldung, Inkasso, Mahnung, Mahnbescheid, Privatinsolvenz, Altersvorsorge, Riester-Rente, Bausparvertrag, Sparplan",
  ],
  BEH: [
    "Ausländerbehörde, Aufenthaltserlaubnis, Aufenthaltstitel, Niederlassungserlaubnis, Duldung, Visum, Visumverlängerung, Aufenthaltsgenehmigung, Aufenthaltszweck, Beschäftigungserlaubnis, Arbeitserlaubnis, Bluecard, Familiennachzug, Einbürgerung, Staatsangehörigkeit, Einbürgerungstest, Aufenthaltsverfestigung",
    "Einwohnermeldeamt, Bürgerbüro, Bürgeramt, Anmeldung, Abmeldung, Ummeldung, Meldebescheinigung, Personalausweis, Reisepass, Geburtsurkunde, Heiratsurkunde, Beglaubigung, Apostille, beglaubigte Übersetzung, Urkundenprüfung, Standesamt, Namensrecht",
    "Antrag, Formular, Antragsformular, Sachbearbeiter, Wartenummer, Warteschlange, Termin, Terminvergabe, Sprechzeiten, Verwaltungsgebühr, Gebührenbescheid, Bearbeitungszeit, Widerspruchsfrist, Frist, Bescheid, Verwaltungsakt, Akteneinsicht",
    "Führungszeugnis, erweitertes Führungszeugnis, polizeiliches Führungszeugnis, Gewerbeanmeldung, Gewerbeamt, Wohnsitz, Melderegister, Abschrift, Registerauskunft, Vollmacht, Beurkundung, Beglaubigungsstempel, Legalisation, Registerauszug, Familienbuch",
  ],
  FRE: [
    "Fitnessstudio, Schwimmbad, Freibad, Hallenbad, Sportplatz, Turnhalle, Joggen, Wandern, Radtour, Yoga, Pilates, Volleyball, Fußball, Tischtennis, Klettern, Schwimmen, Mannschaft, Trainingszeit, Sportkleidung, Laufschuhe",
    "Kino, Theater, Konzert, Museum, Ausstellung, Festival, Veranstaltungskalender, Eintrittskarte, Vorstellung, Spielplan, Abendprogramm, Kneipe, Bar, Biergarten, Café, Tanzen, Nachtleben, Open-Air, Vorverkauf",
    "Malen, Zeichnen, Basteln, Handarbeit, Stricken, Nähen, Töpfern, Fotografieren, Kochen als Hobby, Gartenarbeit, Lesen, Brettspiel, Puzzle, Computerspiel, Spielkonsole, Modellbau, Heimwerken, Werkzeug, Werkbank",
    "Spaziergang, Wanderweg, Aussichtspunkt, Naturpark, Badesee, Picknick, Grillplatz, Spielplatz, Tierpark, Zoo, Freizeitpark, Tagesausflug, Wochenendausflug, Campingplatz, Schrebergarten, Bootsfahrt, Schifffahrt, Sehenswürdigkeit",
    "Gitarre, Klavier, Geige, Trompete, Flöte, Schlagzeug, Bass, Keyboard, Ukulele, Saxofon, Musikunterricht, üben, spielen, Hobby, Freizeit, entspannen, erholen, genießen, Wochenende, Feierabend, ausruhen, Urlaub",
  ],
  KUL: [
    "Moschee, Kirche, Synagoge, Tempel, Gebet, Gottesdienst, Freitagsgebet, Ramadan, Fastenbrechen, Weihnachten, Ostern, Feiertag, Religionsfreiheit, Glaubensgemeinschaft, Gemeinde, Seelsorger, Imam, Pfarrer, Religionsausübung, Gebetsraum",
    "Tradition, Brauch, Heimatland, Muttersprache, Herkunftsland, Landsleute, Diaspora, Kulturfest, Nationalfeiertag, Volkstanz, Tracht, traditionelle Küche, Hochzeitsbräuche, Trauerbräuche, Namensgebung, Beschneidung, Familienfest, Generationenwissen",
    "Interkulturell, Multikulturalität, Kulturschock, Kulturdialog, Toleranz, Vielfalt, Diversität, Rassismus, Diskriminierung, Vorurteil, Gleichberechtigung, Respekt, Wertvorstellung, Grundgesetz, Meinungsfreiheit, Pressefreiheit, Demokratie, Menschenwürde, kulturelle Anpassung, Identität",
    "Literatur, Dichtung, Volksmusik, Weltmusik, Film, Dokumentarfilm, Bibliothek, Buchhandlung, Lesung, Kulturzentrum, Kunstausstellung, Galerie, Heimatzeitung, Diasporamedien, Podcast, Kulturprogramm, Künstler, Kulturförderung",
  ],
  ARB: [
    "Arbeitsvertrag, Probezeit, Befristung, unbefristet, Kündigung, Kündigungsfrist, Kündigungsschutz, Betriebsrat, Gewerkschaft, Tarifvertrag, Mindestlohn, Überstunden, Arbeitsrecht, Abmahnung, Aufhebungsvertrag, Arbeitszeugnis, Arbeitsgericht",
    "Schichtarbeit, Gleitzeit, Teilzeit, Vollzeit, Minijob, Arbeitszeit, Arbeitsbeginn, Feierabend, Mittagspause, Pausenraum, Dienstplan, Zeiterfassung, Stempeluhr, Arbeitsplatz, Büro, Werkstatt, Baustelle, Lager, Kollege, Vorgesetzter, Teamleiter, Abteilung",
    "Bruttolohn, Nettolohn, Gehaltsabrechnung, Lohnzettel, Lohnsteuer, Sozialabgaben, Rentenversicherung, Arbeitslosenversicherung, Lohnfortzahlung, Weihnachtsgeld, Urlaubsgeld, Zuschlag, Nachtzuschlag, Sonntagszuschlag, Gehaltsverhandlung, Lohnerhöhung",
    "Urlaubstage, Urlaubsantrag, Resturlaub, Krankschreibung, Arbeitsunfähigkeit, Elternzeit, Mutterschutz, Bildungsurlaub, Sonderurlaub, Fehlzeit, Heimarbeit, Homeoffice, Telearbeit, Dienstreise, Fortbildung, Weiterbildungsmaßnahme",
  ],
  ARS: [
    "Bewerbung, Bewerbungsschreiben, Anschreiben, Lebenslauf, Bewerbungsfoto, Bewerbungsmappe, Bewerbungsportal, Motivationsschreiben, Deckblatt, Zeugniskopie, Referenz, Arbeitszeugnis, Praktikumszeugnis, Bewerbungsgespräch, Vorstellungsgespräch, Assessment-Center",
    "Stellenanzeige, Stellenangebot, Stellenausschreibung, Jobbörse, Jobportal, Arbeitsagentur, Arbeitsvermittlung, Zeitarbeit, Personalvermittlung, Headhunter, Initiativbewerbung, Blindbewerbung, Jobmesse, Karrieremesse, Stellenprofil, Anforderungsprofil",
    "Berufsanerkennung, Zeugnisanerkennung, Anerkennungsbescheid, Gleichwertigkeit, Nachqualifizierung, Anpassungsqualifizierung, Kenntnisprüfung, Berufsabschluss, Ausbildungsnachweis, IHK, Handwerkskammer, Berufserfahrung, Kompetenzfeststellung, Qualifikationsanalyse, reglementierter Beruf",
    "Arbeitslosengeld, Arbeitslosmeldung, Arbeitssuchendmeldung, Sperrzeit, Vermittlungsvorschlag, Vermittlungsgutschein, Aktivierungsgutschein, Eingliederungszuschuss, Probearbeit, Praktikum, Hospitanz, Schnuppertag, Einstiegsqualifizierung, Arbeitsgelegenheit",
  ],
  UMW: [
    "Mülltrennung, Restmüll, Biomüll, Altpapier, Altglas, Gelber Sack, Wertstofftonne, Sperrmüll, Elektroschrott, Sondermüll, Recyclinghof, Wertstoffhof, Pfandsystem, Mülltonne, Müllabfuhr, Müllgebühr, Abfallkalender, Kompost, Biotonne",
    "Energiesparen, Stromverbrauch, Stromzähler, Solaranlage, Photovoltaik, Wärmepumpe, Energieausweis, Gebäudesanierung, Wärmedämmung, Ökostrom, Energieberater, Energieeffizienz, erneuerbare Energie, Windkraft, LED-Lampe, Standby, Heizkosten, Thermostat",
    "Klimawandel, Erderwärmung, Treibhausgas, CO2-Ausstoß, Klimaschutz, Luftverschmutzung, Feinstaub, Abgaswert, Umweltzone, Fahrverbot, Emissionshandel, Klimaziel, Naturschutzgebiet, Artenschutz, Umweltbewusstsein, Nachhaltigkeit, ökologischer Fußabdruck",
    "Trinkwasser, Wasserqualität, Grundwasser, Abwasser, Kläranlage, Wassersparen, Regenwasser, Hochwasserschutz, Gewässerschutz, Waldsterben, Aufforstung, Baumschutz, Blühwiese, Insektensterben, Artenvielfalt, Biodiversität, Umweltverschmutzung",
  ],
  TEC: [
    "Smartphone, Laptop, Tablet, Computer, Desktop, Bildschirm, Tastatur, Maus, Drucker, Scanner, USB-Stick, Festplatte, Speicherkarte, Ladekabel, Ladegerät, Akku, Kopfhörer, Lautsprecher, Router, WLAN-Router",
    "WLAN, Internetanschluss, Mobilfunkvertrag, Handyvertrag, Prepaid, Datenvolumen, Flatrate, Hotspot, E-Mail-Adresse, E-Mail-Konto, Passwort, Benutzername, Videokonferenz, Messenger, Chatnachricht, Sprachnachricht, Videoanruf, Provider, Netzabdeckung",
    "App, Betriebssystem, Update, Installation, herunterladen, Softwareaktualisierung, Browser, Suchmaschine, Cloud-Speicher, Textverarbeitung, Tabellenkalkulation, Antivirenprogramm, Firewall, Navigationsapp, Übersetzungsapp, Sprachassistent, Einstellung, Benachrichtigung",
    "Datenschutz, Datenschutzerklärung, Datenschutzgrundverordnung, Einwilligung, Cookie, Phishing, Spam, Identitätsdiebstahl, Zwei-Faktor-Authentifizierung, Virenschutz, Sicherheitslücke, Datenverlust, Datensicherung, Backup, Verschlüsselung, Bildschirmsperre, Kindersicherung, Privatsphäre",
  ],
  WEI: [
    "Fortbildung, Weiterbildung, Umschulung, Qualifizierung, Aufstiegsfortbildung, Meisterkurs, Technikerkurs, Fachwirt, Fachkraft, Zusatzqualifikation, Zertifikatskurs, Lehrgang, Seminar, Workshop, Schulung, Bildungsträger, Weiterbildungsanbieter",
    "Berufsausbildung, Ausbildungsplatz, Ausbildungsvertrag, Ausbildungsbetrieb, Berufsschule, Azubi, Auszubildende, Ausbilder, Ausbildungsvergütung, Gesellenprüfung, Abschlussprüfung, Ausbildungsdauer, Ausbildungsberuf, Kammerprüfung, Praxisphase, Lehrjahr",
    "Universität, Fachhochschule, Studiengang, Studienplatz, Studiengebühr, Semesterbeitrag, Immatrikulation, Exmatrikulation, Vorlesung, Seminar, Studienberatung, BAföG, Studentenwohnheim, Studienfach, Bachelor, Master, Fernstudium, berufsbegleitend",
    "Bildungsgutschein, Weiterbildungsprämie, Aufstiegs-BAföG, Meister-BAföG, Begabtenförderung, Stipendium, Bildungsurlaub, Bildungsprämie, Förderprogramm, Qualifizierungschancengesetz, AZAV-Zulassung, Maßnahmennummer, Kostenübernahme, Förderantrag, Bildungsscheck",
  ],
};

// German grammatical/function words — semantically non-selective, relevant in every context.
// These bypass embedding and receive score 1.00 for all Handlungsfelder.
// Scope: Artikel · alle Pronomen · Konjunktionen · Präpositionen ·
//        sein (alle Formen) · haben (alle Formen) · alle Modalverben · alle Hilfsverben
const FUNCTION_WORDS = new Set([
  // ── Artikel ──────────────────────────────────────────────────────────────
  "der", "die", "das", "des", "dem", "den",
  "ein", "eine", "einen", "einem", "einer", "eines",

  // ── Personalpronomen ─────────────────────────────────────────────────────
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mich", "dich", "ihn", "uns", "euch",
  "mir", "dir", "ihm", "ihnen",

  // ── Possessivpronomen ────────────────────────────────────────────────────
  "mein", "meine", "meinen", "meiner", "meinem", "meines",
  "dein", "deine", "deinen", "deiner", "deinem", "deines",
  "sein", "seine", "seinen", "seiner", "seinem", "seines",
  "ihr",  "ihre",  "ihren",  "ihrer",  "ihrem",  "ihres",
  "unser", "unsere", "unseren", "unserer", "unserem", "unseres",
  "euer",  "eure",  "euren",  "eurer",  "eurem",  "eures",

  // ── Demonstrativpronomen ─────────────────────────────────────────────────
  "dieser", "diese", "dieses", "diesen", "diesem", "diesen",
  "jener",  "jene",  "jenes",  "jenen",  "jenem",

  // ── Relativpronomen ──────────────────────────────────────────────────────
  "der", "die", "das", "welcher", "welche", "welches", "welchen", "welchem",
  "dessen", "deren",

  // ── Indefinitpronomen ────────────────────────────────────────────────────
  "man", "jemand", "jemanden", "jemandem", "niemand", "niemanden",
  "jeder", "jede", "jedes", "jeden", "jedem",
  "alle", "alles", "allen", "allem",
  "etwas", "nichts",
  "einige", "einigen", "einigem",
  "viele", "vielen", "vielem",
  "wenige", "wenigen", "wenigem",
  "andere", "anderen", "anderem",
  "beide", "beiden", "beides",
  "selbst", "selber",

  // ── Fragewörter / Relativadverbien ───────────────────────────────────────
  "wer", "wen", "wem", "wessen",
  "was",
  "wo", "wohin", "woher", "wozu", "wofür", "womit", "worüber", "woran",
  "wovon", "wobei", "wodurch",
  "wann", "warum", "weshalb", "weswegen", "wieso", "wie",
  "welch", "welcher", "welche", "welches",

  // ── Konjunktionen (koordinierend) ────────────────────────────────────────
  "und", "oder", "aber", "sondern", "denn", "doch",
  "sowie", "sowohl", "weder", "noch", "entweder", "zwar",
  "jedoch", "allerdings",

  // ── Konjunktionen (subordinierend) ───────────────────────────────────────
  "dass", "ob",
  "weil", "da", "zumal",
  "obwohl", "obgleich", "obschon",
  "wenn", "falls", "sofern",
  "damit", "um",
  "als", "während", "nachdem", "bevor", "bis", "seit", "seitdem",
  "sobald", "solange", "indem", "indem",
  "ohne", "statt", "anstatt",
  "wobei", "wohingegen",

  // ── Konjunktionaladverbien ───────────────────────────────────────────────
  "also", "deshalb", "daher", "deswegen", "folglich", "infolgedessen",
  "trotzdem", "dennoch", "gleichwohl",
  "außerdem", "überdies", "zudem", "darüber hinaus",
  "dann", "danach", "anschließend", "schließlich", "zuerst", "zunächst",
  "erstens", "zweitens", "drittens",
  "einerseits", "andererseits",

  // ── Präpositionen ────────────────────────────────────────────────────────
  "an", "auf", "aus", "bei", "bis", "durch", "für", "gegen",
  "hinter", "in", "mit", "nach", "neben", "ohne", "über", "um",
  "unter", "von", "vor", "zwischen", "ab", "außer",
  "gegenüber", "innerhalb", "außerhalb", "oberhalb", "unterhalb",
  "entlang", "entgegen", "gemäß", "laut", "dank", "aufgrund",
  "infolge", "mithilfe", "wegen", "trotz", "anlässlich", "bezüglich",
  // Kontraktionen
  "am", "im", "ins", "ans", "aufs", "beim", "vom", "zum", "zur",

  // ── verb: sein (alle Formen) ─────────────────────────────────────────────
  "sein",
  "bin", "bist", "ist", "sind", "seid",
  "war", "warst", "waren", "wart",
  "wäre", "wärst", "wären", "wärt",
  "sei", "seist", "seien", "seiet",
  "gewesen",

  // ── verb: haben (alle Formen) ────────────────────────────────────────────
  "haben",
  "habe", "hast", "hat", "habt",
  "hatte", "hattest", "hatten", "hattet",
  "hätte", "hättest", "hätten", "hättet",
  "gehabt",

  // ── Modalverben (alle Formen) ────────────────────────────────────────────
  "können", "kann", "kannst", "könnt", "konnte", "konntest", "konnten", "konntet",
  "könnte", "könntest", "könnten", "könntet", "gekonnt",
  "dürfen", "darf", "darfst", "dürft", "durfte", "durftest", "durften", "durftet",
  "dürfte", "dürftest", "dürften", "dürftet", "gedurft",
  "müssen", "muss", "musst", "müsst", "musste", "musstest", "mussten", "musstet",
  "müsste", "müsstest", "müssten", "müsstet", "gemusst",
  "sollen", "soll", "sollst", "sollt", "sollte", "solltest", "sollten", "solltet",
  "gesollt",
  "wollen", "will", "willst", "wollt", "wollte", "wolltest", "wollten", "wolltet",
  "gewollt",
  "mögen", "mag", "magst", "mögt", "mochte", "mochtest", "mochten", "mochtet",
  "möchte", "möchtest", "möchten", "möchtet", "gemocht",

  // ── Hilfsverb: werden (alle Formen) ─────────────────────────────────────
  "werden",
  "werde", "wirst", "wird", "werdet",
  "wurde", "wurdest", "wurden", "wurdet",
  "würde", "würdest", "würden", "würdet",
  "worden", "geworden",

  // ── Negation ─────────────────────────────────────────────────────────────
  "nicht", "kein", "keine", "keinen", "keiner", "keinem", "keines", "nein",

  // ── Modalpartikeln ───────────────────────────────────────────────────────
  "mal", "eben", "halt", "schon", "eigentlich", "wohl", "bloß", "nur",
  "noch", "auch", "sogar", "zumindest", "immerhin", "ja", "doch",

  // ── Grundzahlen ──────────────────────────────────────────────────────────
  "null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben",
  "acht", "neun", "zehn", "elf", "zwölf", "zwanzig", "dreißig",
  "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig",
  "hundert", "tausend",
  "erste", "zweite", "dritte", "vierte", "fünfte", "sechste",
]);

// Returns true if the word is a grammatical function word (case-insensitive)
function isFunctionWord(word: string): boolean {
  return FUNCTION_WORDS.has(word.toLowerCase());
}

// Cosine similarity between two equal-length vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Per-word relative normalization: for each content word, the 20 max-cosine scores
// are min-max normalized so the highest HF scores 1.00 and the lowest scores 0.00.
// This makes inter-HF discrimination sharp regardless of the word's absolute cosine level.
function normalizeScoresPerWord(maxCosines: number[]): number[] {
  const min = Math.min(...maxCosines);
  const max = Math.max(...maxCosines);
  const range = max - min;
  if (range === 0) return maxCosines.map(() => 0);
  return maxCosines.map((c) => (c - min) / range);
}

// GET: return scored words (with top-3 HF) for a level
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  try {
    const supabase = createClient(await cookies());

    let query = supabase
      .from("wortliste_relevanz")
      .select(
        `
        score,
        computed_at,
        handlungsfeld_code,
        wortlisten!inner (id, wort, level)
      `
      )
      .lt("cosine_raw", 1.0)
      .order("score", { ascending: false });

    if (level) {
      query = query.eq("wortlisten.level", level);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Score GET error:", error);
      return NextResponse.json({ error: "Fehler beim Laden der Scores." }, { status: 500 });
    }

    // Group by word, keep top 3 HF per word
    const wordMap = new Map<
      string,
      {
        id: string;
        wort: string;
        level: string;
        top_hf: { code: string; score: number }[];
      }
    >();

    for (const row of data ?? []) {
      const w = row.wortlisten as unknown as { id: string; wort: string; level: string };
      if (!w) continue;
      if (!wordMap.has(w.id)) {
        wordMap.set(w.id, { id: w.id, wort: w.wort, level: w.level, top_hf: [] });
      }
      const entry = wordMap.get(w.id)!;
      if (entry.top_hf.length < 3) {
        entry.top_hf.push({ code: row.handlungsfeld_code, score: Number(row.score) });
      }
    }

    return NextResponse.json(Array.from(wordMap.values()));
  } catch (error) {
    console.error("Score GET error:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Scores." }, { status: 500 });
  }
}

// POST: embed words for a level and compute relevance scores against all 20 HF
export async function POST(request: Request) {
  const openai = new OpenAI();
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  if (!level) {
    return NextResponse.json({ error: "Level fehlt." }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(await cookies());

    // 1. Fetch all words for this level
    const { data: words, error: wordsError } = await supabase
      .from("wortlisten")
      .select("id, wort")
      .eq("level", level);

    if (wordsError) {
      return NextResponse.json({ error: "Fehler beim Laden der Wörter." }, { status: 500 });
    }
    if (!words?.length) {
      return NextResponse.json({ error: `Keine Wörter für Level ${level} in der Datenbank. Bitte zuerst importieren.` }, { status: 400 });
    }

    // 2. Fetch all Handlungsfelder
    const { data: handlungsfelder, error: hfError } = await supabase
      .from("handlungsfelder")
      .select("code, name")
      .order("sort_order");

    if (hfError || !handlungsfelder?.length) {
      return NextResponse.json({ error: "Fehler beim Laden der Handlungsfelder." }, { status: 500 });
    }

    // 3. Separate function words (grammar) from content words (Verben, Substantive, Adjektive)
    //    Function words get score 1.00 for all HF — they appear in every context.
    const functionWords = words.filter((w) => isFunctionWord(w.wort));
    const contentWords = words.filter((w) => !isFunctionWord(w.wort));

    // 4. Embed content words only (skip function words to save API calls)
    const wordEmbeddings: number[][] = [];
    if (contentWords.length > 0) {
      const wordEmbedResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: contentWords.map((w) => w.wort),
      });
      wordEmbeddings.push(...wordEmbedResponse.data.map((d) => d.embedding));
    }

    // 5. Embed all HF anchors in one batch (20 HF × ~4 anchors each)
    //    hfAnchorEmbeddings[hi] = array of embeddings for all anchors of HF hi
    const allAnchorStrings: string[] = [];
    const hfAnchorCounts: number[] = [];
    for (const hf of handlungsfelder) {
      const anchors = HF_ANCHORS[hf.code] ?? [`${hf.name}: typische Themen und Aktivitäten`];
      allAnchorStrings.push(...anchors);
      hfAnchorCounts.push(anchors.length);
    }
    const anchorEmbedResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: allAnchorStrings,
    });
    const flatAnchorEmbeddings = anchorEmbedResponse.data.map((d) => d.embedding);

    // Slice flat array back into per-HF groups
    const hfAnchorEmbeddings: number[][][] = [];
    let offset = 0;
    for (const count of hfAnchorCounts) {
      hfAnchorEmbeddings.push(flatAnchorEmbeddings.slice(offset, offset + count));
      offset += count;
    }

    // 6. Compute MAX cosine across anchors per HF, then per-word relative normalization
    const relevanzRows: {
      word_id: string;
      handlungsfeld_code: string;
      cosine_raw: number;
      score: number;
      computed_at: string;
    }[] = [];

    const wordEmbedUpdates: { id: string; embedding: string }[] = [];

    const now = new Date().toISOString();

    // Function words → 1.00 for all HF (cosine_raw = 1 signals bypass)
    for (const fw of functionWords) {
      for (const hf of handlungsfelder) {
        relevanzRows.push({
          word_id: fw.id,
          handlungsfeld_code: hf.code,
          cosine_raw: 1.0,
          score: 1.00,
          computed_at: now,
        });
      }
    }

    // Content words → MAX cosine across anchors per HF, then per-word min-max normalization
    for (let wi = 0; wi < contentWords.length; wi++) {
      // Compute max cosine for each HF
      const maxCosines = hfAnchorEmbeddings.map((anchors) =>
        Math.max(...anchors.map((a) => cosineSimilarity(wordEmbeddings[wi], a)))
      );

      // Per-word relative normalization
      const normalizedScores = normalizeScoresPerWord(maxCosines);

      for (let hi = 0; hi < handlungsfelder.length; hi++) {
        relevanzRows.push({
          word_id: contentWords[wi].id,
          handlungsfeld_code: handlungsfelder[hi].code,
          cosine_raw: Math.round(Math.max(0, maxCosines[hi]) * 10000) / 10000,
          score: Math.round(normalizedScores[hi] * 100) / 100,
          computed_at: now,
        });
      }

      wordEmbedUpdates.push({
        id: contentWords[wi].id,
        embedding: JSON.stringify(wordEmbeddings[wi]),
      });
    }

    // 6. Upsert relevanz scores in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < relevanzRows.length; i += BATCH_SIZE) {
      const batch = relevanzRows.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await supabase
        .from("wortliste_relevanz")
        .upsert(batch, { onConflict: "word_id,handlungsfeld_code" });

      if (upsertError) {
        console.error("Relevanz upsert error:", upsertError);
        return NextResponse.json({ error: "Fehler beim Speichern der Scores." }, { status: 500 });
      }
    }

    // 7. Update embeddings on wortlisten rows in batches of 100
    for (let i = 0; i < wordEmbedUpdates.length; i += 100) {
      const batch = wordEmbedUpdates.slice(i, i + 100);
      for (const item of batch) {
        await supabase
          .from("wortlisten")
          .update({ embedding: item.embedding })
          .eq("id", item.id);
      }
    }

    return NextResponse.json({
      level,
      words_scored: words.length,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Score POST error:", error);
    return NextResponse.json({ error: "Fehler beim Scoring." }, { status: 500 });
  }
}
