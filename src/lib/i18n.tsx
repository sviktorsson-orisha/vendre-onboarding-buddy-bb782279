/** Minimal language layer for the setup guide (Swedish default, English option). */
import { useEffect, useMemo, useSyncExternalStore } from "react";

export type Language = "sv" | "en";

const STORAGE_KEY = "vendre.setup.language";

const dictionary = {
  sv: {
    "brand.tagline": "Storefront setup",
    "brand.footer": "Headless storefront setup",
    "hero.eyebrow": "Vendre Surface API v2",
    "hero.title": "Vendre Headless Storefront",
    "hero.titleAccent": "Setup",
    "hero.intro": "Koppla din butik, verifiera anslutningen och gör projektet redo att byggas.",
    "lang.label": "Språk",

    "panel.title": "Setup-guide",
    "panel.step": "Steg {current} av {total}",
    "panel.verified": "Anslutningen är verifierad och klar.",
    "panel.storageWarning": "Guidens framsteg kunde inte sparas i projektets databas. Stegen sparas tillfälligt, men be chatten att sätta upp lagringen för uppstartsguiden.",
    "panel.progress": "{done} av {total} steg klara.",
    "panel.next": "Nästa:",
    "panel.retest": "Testa igen",
    "panel.testing": "Testar",

    "state.done": "Klar",
    "state.current": "Aktuell",
    "state.pending": "Väntar",
    "action.copy": "Kopiera",
    "action.copied": "Kopierat",

    "step1.title": "Skapa OAuth-nycklar",
    "step1.verdictDone": "OAuth-förberedelser bekräftade",
    "step1.verdict": "Skapa en OAuth-klient i Vendre Admin",
    "step1.body": "Skapa klienten innan credentials läggs in. Din",
    "step1.bodyEnd": "visas bara en gång.",
    "step1.adminPath": "Appar & Integrationer → Headless → OAuth",
    "step1.check": "Jag har skapat OAuth-klienten och sparat nycklarna.",

    "step2.title": "Lägg in credentials",
    "step2.verdictDone": "Alla credentials är tillgängliga",
    "step2.verdict": "Lägg in tre värden i formuläret i chatten",
    "step2.where": "Värdena fylls i formuläret som visas här i chatten – inte i koden och inte som ett vanligt chattmeddelande.",
    "step2.reopen": "Syns inte formuläret? Skriv till exempel \"lägg in credentials\" i chatten så öppnas det igen.",
    "step2.reopenPrompt": "lägg in credentials",
    "step2.baseUrl": "Adressen till din Vendre-butik – samma som du använder för att logga in i Vendre Admin, men utan /Admin på slutet. Exempel: https://minbutik.vendre.io (börjar med https:// och utan snedstreck sist).",
    "step2.clientKeys": "Nyckeln från OAuth-klienten du skapade i steg 1.",
    "step2.body":
      "Credentials används endast på serversidan och ska aldrig skrivas i kod eller chatten.",
    "step2.check": "Kontrollera credentials",
    "step2.checking": "Kontrollerar",
    "step2.missing": "Saknas:",

    "step3.title": "Publicera och välj ett enklare domännamn",
    "step3.verdictDone": "Använder {origin}",
    "step3.verdict": "Publicera och ange din valda adress",
    "step3.how1": "Klicka på knappen Publish uppe till höger i Lovable.",
    "step3.how2": "Behåll den föreslagna adressen (t.ex. mitt-namn.lovable.app) eller ändra den till något du föredrar.",
    "step3.how3": "Klicka på Publish changes så att sidan faktiskt publiceras. Utan det klicket är ingenting publicerat.",
    "step3.how4": "Kopiera adressen du valde, klistra in den i fältet nedan och klicka på Använd adressen.",
    "step3.note": "Det måste vara exakt den publicerade adressen – den används i CORS-steget efteråt.",
    "step3.manual": "Detta är ett manuellt steg — inget tekniskt test körs här.",
    "step3.fieldLabel": "Publicerad Lovable-adress",
    "step3.use": "Använd adressen",
    "step3.clear": "Rensa",
    "step3.parseError": "Kunde inte tolka adressen — ange ett namn eller en https-adress.",
    "step3.saved": "Sparad adress:",

    "step4.title": "Konfigurera CORS",
    "step4.verdictDone": "Origins och policyer bekräftade",
    "step4.verdict": "Allowlista storefrontens adresser",
    "step4.intro":
      "CORS ställs in under Appar & Integrationer → Headless → CORS, i rutan \"Tillåtna domäner\". Varje domän läggs till som en egen rad med kryssrutor för vilka funktioner den får använda.",
    "step4.settings": "CORS-inställningar",
    "step4.openCors": "Öppna CORS-inställningarna",
    "step4.openCorsDisabled": "Knappen blir klickbar när credentials är sparade.",
    "step4.how1": "Klicka på \"Lägg till domän\" och klistra in en adress nedan (scheme + host, utan avslutande snedstreck).",
    "step4.how2": "Kryssa i samtliga funktioner på raden – Bootstrap, Session, Oauth, Customer, Shopping cart, Checkout, Default med flera.",
    "step4.how3": "Upprepa för varje adress i listan nedan. Preview, published och lovableproject-adresserna är olika origins och måste alla läggas in.",
    "step4.how4": "Klicka på \"Spara\" längst ned och ladda om denna guide.",
    "step4.originsLabel": "Adresser att lägga in",
    "step4.originsHint":
      "Får du CORS-fel i preview: kontrollera att adressen i webbläsarens adressfält finns med i listan ovan, annars lägg till den också.",
    "step4.policiesLabel": "Funktioner som minst måste vara ikryssade",
    "step4.policiesHint": "Enklast är att kryssa i alla rutor på raden – \"Default\" krävs för konto-anrop och glöms ofta bort.",
    "step4.check": "Jag har lagt in alla domäner och kryssat i funktionerna i Vendre Admin.",


    "step5.title": "Verifiera anslutningen",
    "step5.verdictDone": "Token, CORS, session och läsrättigheter fungerar",
    "step5.verdict": "Kör det tekniska anslutningstestet",
    "step5.body":
      "Testet verifierar OAuth-token, CORS, session/bootstrap och läsning av navigation/menus.",
    "step5.run": "Kör anslutningstest",
    "step5.running": "Testar anslutningen",

    "step6.title": "Redo att börja bygga",
    "step6.verdictDone": "Butiksanslutningen är verifierad",
    "step6.verdict": "Låst tills anslutningen är grön",
    "step6.done": "Setupen är klar. Projektet är redo för storefront-arbete.",
    "step6.pending": "Slutför föregående steg och kör anslutningstestet.",
    "remove.title": "Klar med butiken?",
    "remove.body":
      "När butiken känns helt färdig kan hela uppstartsguiden och den översta informationsraden tas bort. Formuläret för butiks-URL, client id och client secret finns kvar och går fortfarande att öppna.",
    "remove.prompt": "Ta bort setup-guiden enligt .vendre/skills/remove-setup-guide.md",
    "remove.hint": "Kopiera texten och skicka den i chatten. Ändringen går att ångra via projektets historik.",

    "complete.title": "Allt är klart!",
    "complete.body":
      "Anslutningen mot Vendre är verifierad. Butiken byter nu från demodata till din riktiga katalog.",
    "complete.cta": "Börja bygga butiken",

    "notice.title": "Demoläge",
    "notice.body": "Butiken visar just nu exempeldata. Gör klart uppstartsguiden för att koppla din Vendre-butik och visa riktiga produkter.",
    "notice.headline": "Steg kvar: koppla din butik",
    "notice.cta": "Öppna uppstartsguiden",
    "notice.ctaPending": "Gör klart guiden",

    "store.search": "Sök produkter",
    "store.cart": "Kundvagn",
    "store.menu": "Meny",
    "store.cartEmpty": "Kundvagnen är tom.",
    "store.checkout": "Till kassan",
    "store.checkoutDemo": "Kassan öppnas när butiken är kopplad.",
    "store.total": "Summa",
    "store.totalInclVat": "Summa (inkl. moms)",
    "store.totalVatNote": "Produktpriserna visas exkl. moms. Butikens totalsumma anges inkl. moms.",
    "store.addToCart": "Lägg i kundvagn",
    "store.outOfStock": "Slut i lager",
    "store.readMore": "Läs mer",
    "store.inStock": "I lager",
    "store.selectVariant": "Välj alternativ för att kunna köpa",
    "store.viewAll": "Visa alla",
    "store.viewAllIn": "Visa allt i {name}",
    "store.heroTitle": "Din butik, redo från dag ett",
    "store.heroBody":
      "Startsida, kategorier, produktsidor och kundvagn finns redan i templaten. Koppla Vendre så fylls allt med din egen katalog.",
    "store.heroCta": "Handla nu",
    "store.categories": "Kategorier",
    "store.featured": "Utvalda produkter",
    "store.products": "produkter",
    "store.subcategories": "Underkategorier",
    "store.remove": "Ta bort",
    "store.loading": "Laddar",
    "store.notFound": "Produkten kunde inte hittas.",
    "store.backToStore": "Tillbaka till butiken",
    "store.description": "Beskrivning",
    "store.specifications": "Specifikationer",
    "store.footerNote": "Byggd med Vendre Surface API v2.",
    "store.info": "Kundservice",
    "store.pages": "Sidor",
    "store.pageNotFound": "Sidan kunde inte hittas.",
    "store.pageEmpty": "Den här sidan saknar innehåll.",
    "store.home": "Start",
    "store.sort": "Sortera",
    "store.filters": "Filter",
    "store.clearFilters": "Rensa filter",
    "store.showProducts": "Visa produkter",
    "store.priceFrom": "Från",
    "store.priceTo": "Till",
    "store.noResults": "Inga produkter matchar ditt urval.",
    "store.loadError": "Kategorin kunde inte laddas. Kontrollera butiksanslutningen.",
    "store.prev": "Föregående",
    "store.next": "Nästa",

    "search.title": "Sökresultat",
    "search.for": "Träffar för “{q}”",
    "search.hits": "{count} träffar",
    "search.viewAll": "Visa alla resultat för “{q}”",
    "search.minChars": "Skriv minst 3 tecken för att söka.",
    "search.searching": "Söker…",
    "search.noHits": "Inga produkter matchade “{q}”.",
    "search.suggestions": "Produktförslag",

    "account.title": "Mitt konto",
    "account.signIn": "Logga in",
    "account.signUp": "Skapa konto",
    "account.signOut": "Logga ut",
    "account.email": "E-post",
    "account.password": "Lösenord",
    "account.confirm": "Bekräfta lösenord",
    "account.forgot": "Glömt lösenord?",
    "account.forgotSent": "Om e-postadressen finns har ett återställningsmail skickats.",
    "account.loginIntro": "Logga in för att se dina ordrar, adresser och uppgifter.",
    "account.registerIntro": "Skapa ett konto för snabbare kassa och koll på dina ordrar.",
    "account.overview": "Översikt",
    "account.orders": "Ordrar",
    "account.addresses": "Adresser",
    "account.mainAddress": "Huvudadress",
    "account.noAddresses": "Inga adresser finns registrerade.",
    "account.users": "Användare",
    "account.profile": "Redigera konto",
    "account.save": "Spara",
    "account.saving": "Sparar",
    "account.saved": "Sparat",
    "account.greeting": "Hej {name}!",
    "account.overviewBody": "Här hanterar du dina ordrar, adresser och kontouppgifter.",
    "account.latestOrder": "Senaste ordern",
    "account.noOrders": "Du har inga ordrar ännu.",
    "account.noOrderLines": "Ordern innehåller inga produktrader.",
    "account.order": "Order",
    "account.date": "Datum",
    "account.status": "Status",
    "account.total": "Summa",
    "account.orderDetails": "Orderdetaljer",
    "account.quantity": "Antal",
    "account.price": "Pris",
    "account.exclVat": "exkl. moms",
    "account.shipping": "Frakt",
    "account.tax": "Moms",
    "account.noUsers": "Inga ytterligare användare är kopplade till kontot.",
    "account.role": "Roll",
    "account.name": "Namn",
    "account.firstname": "Förnamn",
    "account.lastname": "Efternamn",
    "account.company": "Företag",
    "account.personnummer": "Personnummer",
    "account.orgnumber": "Organisationsnummer",
    "account.customerType": "Kundtyp",
    "account.private": "Privatperson",
    "account.business": "Företagskund",
    "account.street": "Gatuadress",
    "account.street2": "Adressrad 2",
    "account.postcode": "Postnummer",
    "account.city": "Ort",
    "account.state": "Län",
    "account.country": "Land",
    "account.phone": "Telefon",
    "account.mobile": "Mobil",
    "account.type": "Kundtyp",
    "account.typePrivate": "Privat",
    "account.typeCompany": "Företag",
    "account.gender": "Kön",
    "account.genderMale": "Man",
    "account.genderFemale": "Kvinna",
    "account.newsletter": "Prenumerera på nyhetsbrevet",
    "account.consent": "Jag godkänner integritetspolicyn",
    "account.required": "Fältet är obligatoriskt",
    "account.mismatch": "Lösenorden matchar inte",
    "account.malformed":
      "Kontot kunde inte skapas. E-postadressen eller personnumret används kanske redan – kontrollera uppgifterna eller logga in i stället.",
    "account.pendingTitle": "Kontot väntar på godkännande",
    "account.pendingBody":
      "Vi har tagit emot din ansökan. Butiken granskar den manuellt och du kan logga in när kontot har aktiverats.",
    "account.demoNote": "Demodata visas tills Vendre-kontot är kopplat.",
    "account.signedOutBody": "Logga in för att se ditt konto.",
    "account.back": "Tillbaka",
  },

  en: {
    "brand.tagline": "Storefront setup",
    "brand.footer": "Headless storefront setup",
    "hero.eyebrow": "Vendre Surface API v2",
    "hero.title": "Vendre Headless Storefront",
    "hero.titleAccent": "Setup",
    "hero.intro": "Connect your store, verify the connection and get the project ready to build.",
    "lang.label": "Language",

    "panel.title": "Setup guide",
    "panel.step": "Step {current} of {total}",
    "panel.verified": "The connection is verified and ready.",
    "panel.storageWarning": "The guide progress could not be saved to this project's database. Steps are kept temporarily — ask the chat to set up the setup-guide storage.",
    "panel.progress": "{done} of {total} steps completed.",
    "panel.next": "Next:",
    "panel.retest": "Test again",
    "panel.testing": "Testing",

    "state.done": "Done",
    "state.current": "Current",
    "state.pending": "Pending",
    "action.copy": "Copy",
    "action.copied": "Copied",

    "step1.title": "Create OAuth keys",
    "step1.verdictDone": "OAuth preparation confirmed",
    "step1.verdict": "Create an OAuth client in Vendre Admin",
    "step1.body": "Create the client before adding credentials. Your",
    "step1.bodyEnd": "is only shown once.",
    "step1.adminPath": "Apps & Integrations → Headless → OAuth",
    "step1.check": "I have created the OAuth client and saved the keys.",

    "step2.title": "Add credentials",
    "step2.verdictDone": "All credentials are available",
    "step2.verdict": "Add three values in the form in the chat",
    "step2.where": "Enter the values in the form shown here in the chat – not in the code and not as a regular chat message.",
    "step2.reopen": "Don't see the form? Type something like \"add credentials\" in the chat and it opens again.",
    "step2.reopenPrompt": "add credentials",
    "step2.baseUrl": "The address of your Vendre store – the one you use to log in to Vendre Admin, without /Admin at the end. Example: https://mystore.vendre.io (starts with https:// and no trailing slash).",
    "step2.clientKeys": "The key from the OAuth client you created in step 1.",
    "step2.body": "Credentials are used server-side only and must never appear in code or chat.",
    "step2.check": "Check credentials",
    "step2.checking": "Checking",
    "step2.missing": "Missing:",

    "step3.title": "Publish and pick a simpler domain name",
    "step3.verdictDone": "Using {origin}",
    "step3.verdict": "Publish and enter your chosen address",
    "step3.how1": "Click the Publish button in the top right corner of Lovable.",
    "step3.how2": "Keep the suggested address (e.g. my-name.lovable.app) or change it to something you prefer.",
    "step3.how3": "Click Publish changes so the site is actually published. Without that click nothing is published.",
    "step3.how4": "Copy the address you chose, paste it into the field below and click Use address.",
    "step3.note": "It must be exactly the published address – it is used in the CORS step afterwards.",
    "step3.manual": "This is a manual step — no technical test runs here.",
    "step3.fieldLabel": "Published Lovable address",
    "step3.use": "Use address",
    "step3.clear": "Clear",
    "step3.parseError": "Could not parse the address — enter a name or an https address.",
    "step3.saved": "Saved address:",

    "step4.title": "Configure CORS",
    "step4.verdictDone": "Origins and policies confirmed",
    "step4.verdict": "Allowlist the storefront addresses",
    "step4.intro":
      "CORS is configured under Apps & Integrations → Headless → CORS, in the \"Allowed domains\" section. Each domain is added as its own row with checkboxes for the features it may use.",
    "step4.settings": "CORS settings",
    "step4.openCors": "Open CORS settings",
    "step4.openCorsDisabled": "The button becomes clickable once credentials are saved.",
    "step4.how1": "Click \"Add domain\" and paste one of the addresses below (scheme + host, no trailing slash).",
    "step4.how2": "Tick every feature on that row – Bootstrap, Session, Oauth, Customer, Shopping cart, Checkout, Default and the rest.",
    "step4.how3": "Repeat for every address in the list below. Preview, published and lovableproject addresses are separate origins and all need a row.",
    "step4.how4": "Click \"Save\" at the bottom, then reload this guide.",
    "step4.originsLabel": "Addresses to add",
    "step4.originsHint":
      "Still seeing CORS errors in preview? Check that the address in your browser's address bar is in the list above, and add it if not.",
    "step4.policiesLabel": "Features that must be ticked",
    "step4.policiesHint": "Simplest is to tick every box on the row – \"Default\" is required for account calls and is often missed.",
    "step4.check": "I have added every domain and ticked the features in Vendre Admin.",


    "step5.title": "Verify the connection",
    "step5.verdictDone": "Token, CORS, session and read access work",
    "step5.verdict": "Run the technical connection test",
    "step5.body": "The test verifies OAuth token, CORS, session/bootstrap and reading navigation/menus.",
    "step5.run": "Run connection test",
    "step5.running": "Testing connection",

    "step6.title": "Ready to start building",
    "step6.verdictDone": "The store connection is verified",
    "step6.verdict": "Locked until the connection is green",
    "step6.done": "Setup is complete. The project is ready for storefront work.",
    "step6.pending": "Complete the previous steps and run the connection test.",
    "remove.title": "Finished with the store?",
    "remove.body":
      "Once the store feels complete, the whole setup guide and the top notice bar can be removed. The form for store URL, client id and client secret stays and can still be opened.",
    "remove.prompt": "Remove the setup guide following .vendre/skills/remove-setup-guide.md",
    "remove.hint": "Copy the text and send it in the chat. The change can be undone from the project history.",

    "complete.title": "Everything is ready!",
    "complete.body":
      "The Vendre connection is verified. The storefront now switches from demo data to your real catalogue.",
    "complete.cta": "Start building the store",

    "notice.title": "Demo mode",
    "notice.body": "The storefront is showing sample data. Finish the setup guide to connect your Vendre store and show real products.",
    "notice.headline": "Action needed: connect your store",
    "notice.cta": "Open the setup guide",
    "notice.ctaPending": "Finish the guide",

    "store.search": "Search products",
    "store.cart": "Cart",
    "store.menu": "Menu",
    "store.cartEmpty": "Your cart is empty.",
    "store.checkout": "Go to checkout",
    "store.checkoutDemo": "Checkout opens once the store is connected.",
    "store.total": "Total",
    "store.totalInclVat": "Total (incl. VAT)",
    "store.totalVatNote": "Product prices are shown excl. VAT. The store's cart total is returned incl. VAT.",
    "store.addToCart": "Add to cart",
    "store.outOfStock": "Out of stock",
    "store.readMore": "Read more",
    "store.inStock": "In stock",
    "store.selectVariant": "Select an option to continue",
    "store.viewAll": "View all",
    "store.viewAllIn": "View all in {name}",
    "store.heroTitle": "Your store, ready from day one",
    "store.heroBody":
      "Home, categories, product pages and cart already ship with the template. Connect Vendre and it fills up with your own catalogue.",
    "store.heroCta": "Shop now",
    "store.categories": "Categories",
    "store.featured": "Featured products",
    "store.products": "products",
    "store.subcategories": "Subcategories",
    "store.remove": "Remove",
    "store.loading": "Loading",
    "store.notFound": "The product could not be found.",
    "store.backToStore": "Back to the store",
    "store.description": "Description",
    "store.specifications": "Specifications",
    "store.footerNote": "Built with Vendre Surface API v2.",
    "store.info": "Customer service",
    "store.pages": "Pages",
    "store.pageNotFound": "The page could not be found.",
    "store.pageEmpty": "This page has no content yet.",
    "store.home": "Home",
    "store.sort": "Sort",
    "store.filters": "Filters",
    "store.clearFilters": "Clear filters",
    "store.showProducts": "Show products",
    "store.priceFrom": "From",
    "store.priceTo": "To",
    "store.noResults": "No products match your selection.",
    "store.loadError": "The category could not be loaded. Check the store connection.",
    "store.prev": "Previous",
    "store.next": "Next",

    "search.title": "Search results",
    "search.for": "Results for “{q}”",
    "search.hits": "{count} results",
    "search.viewAll": "Show all results for “{q}”",
    "search.minChars": "Type at least 3 characters to search.",
    "search.searching": "Searching…",
    "search.noHits": "No products matched “{q}”.",
    "search.suggestions": "Product suggestions",

    "account.title": "My account",
    "account.signIn": "Sign in",
    "account.signUp": "Create account",
    "account.signOut": "Sign out",
    "account.email": "Email",
    "account.password": "Password",
    "account.confirm": "Confirm password",
    "account.forgot": "Forgot password?",
    "account.forgotSent": "If the email exists, a reset link has been sent.",
    "account.loginIntro": "Sign in to see your orders, addresses and details.",
    "account.registerIntro": "Create an account to check out faster and follow your orders.",
    "account.overview": "Overview",
    "account.orders": "Orders",
    "account.addresses": "Addresses",
    "account.mainAddress": "Main address",
    "account.noAddresses": "No addresses registered.",
    "account.users": "Users",
    "account.profile": "Edit account",
    "account.save": "Save",
    "account.saving": "Saving",
    "account.saved": "Saved",
    "account.greeting": "Hi {name}!",
    "account.overviewBody": "Here you manage your orders, addresses and account details.",
    "account.latestOrder": "Latest order",
    "account.noOrders": "You have no orders yet.",
    "account.noOrderLines": "This order has no product lines.",
    "account.order": "Order",
    "account.date": "Date",
    "account.status": "Status",
    "account.total": "Total",
    "account.orderDetails": "Order details",
    "account.quantity": "Qty",
    "account.price": "Price",
    "account.exclVat": "excl. VAT",
    "account.shipping": "Shipping",
    "account.tax": "VAT",
    "account.noUsers": "No additional users are connected to this account.",
    "account.role": "Role",
    "account.name": "Name",
    "account.firstname": "First name",
    "account.lastname": "Last name",
    "account.company": "Company",
    "account.personnummer": "Personal ID number",
    "account.orgnumber": "Organisation number",
    "account.customerType": "Customer type",
    "account.private": "Private person",
    "account.business": "Business customer",
    "account.street": "Street address",
    "account.street2": "Address line 2",
    "account.postcode": "Postcode",
    "account.city": "City",
    "account.state": "State/Region",
    "account.country": "Country",
    "account.phone": "Phone",
    "account.mobile": "Mobile",
    "account.type": "Customer type",
    "account.typePrivate": "Private",
    "account.typeCompany": "Company",
    "account.gender": "Gender",
    "account.genderMale": "Male",
    "account.genderFemale": "Female",
    "account.newsletter": "Subscribe to the newsletter",
    "account.consent": "I accept the privacy policy",
    "account.required": "This field is required",
    "account.mismatch": "The passwords do not match",
    "account.malformed":
      "The account could not be created. The email address or ID number may already be in use — check the details or sign in instead.",
    "account.pendingTitle": "Your account is awaiting approval",
    "account.pendingBody":
      "We have received your application. The store reviews it manually and you can sign in once the account is activated.",
    "account.demoNote": "Demo data is shown until the Vendre account is connected.",
    "account.signedOutBody": "Sign in to see your account.",
    "account.back": "Back",
  },

} as const;

export type TranslationKey = keyof (typeof dictionary)["sv"];

type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

let currentLanguage: Language = "sv";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLanguage(next: Language) {
  currentLanguage = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }
  emit();
}

function translate(
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
) {
  const raw: string = dictionary[language][key] ?? dictionary.sv[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    raw,
  );
}

/** Reads the current language without React context (SSR-safe, always "sv" on the server). */
export function useI18n(): I18nValue {
  const language = useSyncExternalStore(
    subscribe,
    () => currentLanguage,
    () => "sv" as Language,
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if ((stored === "sv" || stored === "en") && stored !== currentLanguage) {
      setLanguage(stored);
    }
  }, []);

  return useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language],
  );
}
