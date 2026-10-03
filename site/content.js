// ─────────────────────────────────────────────────────────────────────────────
// The Gloss Spot: every word, price and photo on the site lives here.
// Edit this file, then run `npm run build` (no API calls, no cost).
// site/build.js turns it into output/*.html, sitemap.xml and REDESIGN.md.
// ─────────────────────────────────────────────────────────────────────────────

// ── Business facts (NAP must match Google Business Profile exactly) ─────────
export const biz = {
  name: "The Gloss Spot",
  street: "606 N. Country Fair Dr",
  city: "Champaign",
  state: "IL",
  zip: "61821", // ⚠ confirm against Google Business Profile
  phone: "217-600-2108",
  tel: "+12176002108",
  email: "theglossspotil@gmail.com",
  domain: "https://www.theglossspotil.com",
  owners: "Dominic (Dom) and Dylan Pierson",
  // ⚠ Shop hours: carried over from the old site. Confirm they match GBP.
  hours: [
    { label: "Mon–Sat", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "20:00", text: "8am – 8pm" },
    { label: "Sunday", days: ["Sunday"], opens: "13:00", closes: "20:00", text: "1pm – 8pm" },
  ],
  priceRange: "$90 – $5,500",
  reviewCount: "90+",
  googleReviews: "https://share.google/Wr0NTsR0CmFTlYRtk",
  sameAs: [
    "https://www.facebook.com/theglossspot",
    "https://www.instagram.com/theglossspotil",
    "https://share.google/Wr0NTsR0CmFTlYRtk",
    "https://www.yelp.com/biz/the-gloss-spot-auto-detailing-champaign-3",
  ],
  logo: "https://res.cloudinary.com/djp1yfsj5/image/upload/f_auto,q_auto,w_400/Gloss_Spot_5_ranrsj.png",
  favicon: "https://res.cloudinary.com/djp1yfsj5/image/upload/f_auto,q_auto,w_64/Gloss_Spot_500_x_500_px_1_eviirr",
  ghlCalendarId: "pR5kB7NNiIu7tnoGPBI5",
  ghlChatWidgetId: "685d898ba8069128b9ba306b",
  // Referral offer stays hidden until Dom confirms it. Set true to show
  // "Send a friend. You both get $25 off." in the footer.
  referralConfirmed: false,
};
biz.address = `${biz.street}, ${biz.city}, ${biz.state}`;
biz.mapsQuery = encodeURIComponent(`${biz.name}, ${biz.street}, ${biz.city}, ${biz.state} ${biz.zip}`);
biz.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${biz.mapsQuery}`;
biz.mapEmbed = `https://maps.google.com/maps?q=${biz.mapsQuery}&z=15&output=embed`;

// ── Photos ──────────────────────────────────────────────────────────────────
// Real Gloss Spot photos only. `cld` = Cloudinary public ID (resized on the
// fly). `src` = a full URL used as-is (shop photos currently live on OpenArt;
// move them to Cloudinary and swap to `cld` for faster loads).
// ⚠ ALT TEXT: the build machine could not open these photos, so alts are
// generic. Replace each with the real car + service, e.g.
// "ceramic coated black F-150 Champaign IL".
const OA = "https://cdn.openart.ai/openart-uploads/production/2026-10/create-image/cMsgRdDVyjzN24ccys4i/";
export const photos = {
  hero:     { cld: "IMG_5948_totw8k", alt: "Freshly detailed car with a deep gloss finish at The Gloss Spot in Champaign IL" },
  hero2:    { cld: "IMG_6007_huulif", alt: "Detailed vehicle exterior with clean glossy paint, Champaign IL" },
  hero3:    { cld: "IMG_6010_bgc6ll", alt: "Car detailing result showing reflective paint, Champaign IL" },
  hero4:    { cld: "IMG_6011_xle1gg", alt: "Hand-detailed vehicle finish by The Gloss Spot, Champaign IL" },
  hero5:    { cld: "IMG_6240_n97i25", alt: "Vehicle after a full detail at The Gloss Spot, Champaign IL" },
  value:    { cld: "IMG_5969_pmvndg", alt: "Close-up of detailed paint and wheel, Champaign IL" },
  bigCta:   { cld: "IMG_6283_oxnzvf", alt: "Glossy detailed car ready for pickup, Champaign IL" },
  g1:       { cld: "IMG_5310_xepias", alt: "Car interior after detailing, Champaign IL" },
  g2:       { cld: "IMG_5403_sy036b", alt: "Detailed vehicle exterior, Champaign IL" },
  g3:       { cld: "IMG_5605_gw8kiq", alt: "Paint gloss after machine polish, Champaign IL" },
  g4:       { cld: "IMG_5876_d9uiq0", alt: "Clean wheels and tires after a detail, Champaign IL" },
  g5:       { cld: "IMG_5970_gc28l5", alt: "Detailed car finish under shop lights, Champaign IL" },
  g6:       { cld: "IMG_6231_zxhqub", alt: "Interior detail with clean seats and carpet, Champaign IL" },
  g7:       { cld: "IMG_5853_cxrrpb", alt: "Exterior detailing result, Champaign IL" },
  g8:       { cld: "IMG_5644_zeces6", alt: "Car detailing work in progress, Champaign IL" },
  g9:       { cld: "IMG_5582_d2eijo", alt: "Detailed vehicle paint reflection, Champaign IL" },
  shopBay:  { src: OA + "02-bay-garage-door-wide_1790847096162_5dab8126.jpg", w: 1592, h: 2620, alt: "The Gloss Spot detail shop bay door at 606 N. Country Fair Dr, Champaign IL" },
  shopDoor: { src: OA + "01-bay-garage-door_1790847090678_c1d907c1.jpg", w: 2060, h: 2724, alt: "Garage bay at The Gloss Spot detail shop in Champaign IL" },
  shopFloor:{ src: OA + "03-main-floor_1790847101157_3e8e2d15.jpg", w: 2036, h: 2592, alt: "Main detailing floor inside The Gloss Spot shop, Champaign IL" },
  shopOffice:{ src: OA + "07-front-office_1790847120292_507ec405.jpg", w: 1948, h: 2448, alt: "Front office at The Gloss Spot, 606 N. Country Fair Dr, Champaign IL" },
  // Real customer cars, short zoom clips (self-hosted in output/media/).
  // `src` is the poster frame; `video` plays over it once the page loads.
  vCorvette: { src: "/media/blue-corvette.jpg", video: "/media/blue-corvette.mp4", w: 960, h: 946, alt: "Blue C8 Corvette with fresh gloss in The Gloss Spot shop, Champaign IL" },
  vWhiteYukon: { src: "/media/white-yukon.jpg", video: "/media/white-yukon.mp4", w: 960, h: 946, alt: "White GMC Yukon after a full detail, Champaign IL" },
  vMatteBmw: { src: "/media/matte-bmw.jpg", video: "/media/matte-bmw.mp4", w: 960, h: 946, alt: "Matte black BMW sedan detailed by The Gloss Spot, Champaign IL" },
  vBlackYukon: { src: "/media/black-yukon.jpg", video: "/media/black-yukon.mp4", w: 960, h: 946, alt: "Black GMC Yukon after detailing, Champaign IL" },
  // Photo of Dom & Dylan together. Paste a Cloudinary ID here when ready;
  // until then the story block shows a branded card instead.
  brothers: null,
};

// Before/after pairs for the slider. Add pairs as { before, after, alt } using
// Cloudinary IDs. Empty → the slider section shows recent work instead.
export const beforeAfter = [];

// ── Background video (OpenArt animations made from our real photos) ─────────
// Filled in by the build from site/media.json. Each entry: { mp4, poster }.
export { default as media } from "./media.js";

// ── Prices ──────────────────────────────────────────────────────────────────
export const sizes = ["Coupe", "Sedan", "SUV / Truck", "Large 3-Row SUV"];
export const ceramicSizes = ["Coupe", "Sedan", "SUV / Truck", "Minivan / Large SUV / Truck"];

export const detailPackages = [
  {
    key: "express", name: "Express Detail", prices: [90, 100, 120, 145], hours: [1, 1, 1.25, 1.5],
    short: "Quick vacuum, wipe-down and exterior wash.",
    includes: ["Interior vacuum", "Dash and panel wipe-down", "Hand wash and dry", "Wheels and tires cleaned", "Windows cleaned"],
  },
  {
    key: "full", name: "Full Detail", prices: [225, 250, 285, 315], hours: [2.5, 2.75, 3, 3.5], popular: true,
    short: "Complete interior and exterior detail.",
    includes: ["Foam pre-soak and hand wash", "Wheels, tires and door jambs", "Full interior vacuum, seats and mats", "Dash, panels and vents detailed", "Windows inside and out", "Tire dressing and quick sealant"],
  },
  {
    key: "lux", name: "Lux Package", prices: [325, 350, 400, 450], hours: [5, 5.5, 6, 6.5],
    short: "Full detail + one-step paint correction and sealant.",
    includes: ["Everything in the Full Detail", "One-step machine paint correction", "Paint sealant for lasting gloss", "Two-step correction: +$100"],
    twoStepAdd: 100,
  },
];

export const ceramic = {
  tiers: ["3-Year", "6-Year", "10-Year"],
  // rows follow ceramicSizes; columns follow tiers
  prices: [
    [1100, 1450, 1800],
    [1350, 1700, 2050],
    [1600, 1950, 2300],
    [1850, 2200, 2550],
  ],
  hours: 8,
  includes: ["Paint correction included with every package", "Decon wash and panel prep", "Ceramic coating on all painted surfaces", "Hydrophobic, slick, easy-wash finish"],
};

export const ppf = {
  note: "Sedan baseline. Larger vehicles are quoted.",
  packages: [
    { name: "Essentials", range: [800, 1000] },
    { name: "Track Pack", range: [1900, 2500] },
    { name: "Full Body", range: [4000, 5500] },
  ],
};

export const wraps = {
  rows: [
    { name: "Coupe / Sedan", range: [2400, 2700] },
    { name: "SUV / Crossover", range: [2900, 3200] },
    { name: "Full-Size Truck / Large SUV", range: [3300, 3600] },
    { name: "Cargo Van / Sprinter", custom: true },
  ],
  extras: [
    ["Partial wraps", "from $800"],
    ["Specialty finish", "+$400 – $600"],
    ["Old wrap removal", "$500 – $800"],
    ["Prep and edge resealing", "$150 – $350, if needed"],
  ],
};

// Exterior-only weekly plan.
export const maintenance = {
  name: "Exterior Maintenance",
  price: 149,
  includes: ["4 exterior details a month, one every week", "Hand wash, wheels, tires and glass", "A regular weekly time, set with Dom"],
};

export const membership = {
  price: 299,
  includes: ["Weekly exterior wash and wax", "4 interior maintenance cleans a month", "A regular weekly time, set with Dom"],
};

// ── Reviews (verbatim from Google, never written by us) ─────────────────────
export const reviews = [
  { name: "Macy Ruple", text: "Dom was incredible!!! Our car belonged to friends before us, it's a 2008, so I never expected perfection. When I say this is the cleanest I've EVER seen this car… I'm FLOORED." },
  { name: "Kevin Clark", text: "I had my 2024 black Suburban detailed by Gloss Spot. They did an awesome job. It looks better than when I brought it home. Very detail oriented, professional service." },
  { name: "Sheila T", text: "The quality of the work was excellent. I lost a ring seven years ago — a family heirloom that belonged to my mother who passed 20 years ago. They found the ring under my seat. Worth every penny." },
  { name: "Cassandra Beer", text: "I have 4 kids and spend a great deal of time in my van. Despite vacuuming once a week, it looks horrid. Dom, however, cleans it like brand new. He takes a lot of pride in his work and it shows." },
  { name: "Jim Keiken", text: "Dom did terrific work. My truck looks showroom new, everything spotless inside and out. Professional operation from scheduling to final product." },
  { name: "Raj Smith", text: "Dom is the man!!! He did an amazing job with my Yukon. Very detail oriented and will make your car look amazing. Will come back again!" },
  { name: "Paige R", text: "We had the best experience when we brought our car here to have the interior detailed. Dom was extremely professional, friendly, and our car came out perfect." },
  { name: "Katelynn Nguyen", text: "The detailing was PERFECT. My 13yr old SUV looks brand new, from the exterior to the leather seats. I couldn't be happier with the results!" },
  { name: "Robert Wengert", text: "I own a twelve year old Toyota Avalon. The headlight covers had become blurry and yellowish. Gloss Spot cleared them right up. Outstanding service." },
  { name: "Kenny Nguyen", text: "From knocking on my door to bringing my car back to life, Gloss Spot has truly surprised me with how great their work is. Dominic takes a lot of pride in his work — the dog hair removal and leather conditioning made a huge difference." },
  { name: "Mark Howard", text: "The Gloss Spot Auto Detailing did a fantastic job on my F150. I'd recommend them highly!" },
  { name: "Genesis Gebil", text: "Dom has been taking care of mine and my mom's car for a while now, and every time, the results have been amazing. We keep coming back because of the quality and care he puts into every detail." },
  { name: "Lina Abbadi", text: "Dom was super chill and professional and obviously takes pride in his work. My car looks and FEELS so clean — I could have never done a job that good myself. My car was filthy when I first bought it used." },
  { name: "Blake Goodman", text: "I work a labor job plus I have a very messy dog so it gets dirty very quickly and he got it all out! It looks amazing and smells great just like when I first bought it." },
  { name: "John Lawyer", text: "Outstanding job. Made my wife's car look like new, and washed my truck that had road tar and diesel stains. His cleaner did a better job and faster than the solvent I normally use." },
  { name: "Reese Donsbach", text: "Just got back from vacation in Florida and my car was an absolute disaster after 12 hours of driving each way. I thought it would never look the same. They made it look new again." },
  { name: "Kishan Patel", text: "They went above and beyond to make sure every corner of my car was spotless inside and out. My car hasn't looked this good since the day I bought it. Definitely worth every penny!" },
  { name: "Elizabeth Churchya", text: "Impeccable service! Arrived promptly as scheduled and was extremely thorough with both interior and exterior detailing. Car was left extremely clean with a fresh but not overpowering scent." },
  { name: "TT Y", text: "Dom did such an amazing job on my car! The outside is sparkling clean and shiny, and the inside looks super fresh and spotless. It honestly feels like I'm driving a brand-new car again." },
  { name: "Derek Rankin", text: "Dom did an excellent job detailing our vehicle! The full service detail was thorough and convenient, as he came to our home in Mahomet." },
  { name: "Angel Ybarra", text: "Amazing work! 10 out of 10 full detail service inside and out. Came to my residence outskirts of Urbana. Will be booking again." },
  { name: "Jeffrey Davis", text: "5 stars ain't enough. Showed up the day after I called on the weekend to clean out my A-to-B car and I wasn't expecting it to look this good in its life. Great customer service and a well-run business." },
  { name: "Alien", text: "10/10, perfect experience. They went above and beyond in all areas and it really is the best customer experience I've ever had at a car detailing." },
  { name: "Shelbi Hynds", text: "SERVICE OF THE YEAR!!!!! I have taken my car to get detailed before but having them come to you and doing a 15/10 job! Couldn't have asked for anything better! Would highly recommend!" },
  { name: "Samantha Gannon", text: "If I could rate 1 million stars, I would! Made me feel like I was driving a brand new car home! They came straight to my job so I didn't have to schedule around anything. WILL ABSOLUTELY BOOK AGAIN!" },
  { name: "Eric Fagerlin", text: "They came to where my car was and had all their equipment with them. Very professional, accommodating, and thorough. When it was done I was blown away by how nice my car looked and smelled!" },
  { name: "Katie Pierson", text: "The Gloss Spot did such an amazing job on my detail making my 2016 Jeep look brand new. The extra convenience of them coming to my house was amazing!" },
  { name: "Artem Pichshuk", text: "Got my car done by Dominic. Really polite young man. Really happy with my squeaky clean car!" },
  { name: "Isis Rose", text: "The technician met me at a convenient location and did a great job detailing my car's interior! I don't remember the last time my car was this clean! Signed, a mom of 2." },
  { name: "Chad Detamore", text: "Great to see such hard working young men. They do an awesome job and will have your car looking as good as new. Best part is they come to you — very convenient!" },
  { name: "Jordan Gebil Neal", text: "I've used this service twice now for interior cleaning. Always amazed at how good my car looks afterward. So convenient that he comes right to your house, and he's super friendly and professional." },
  { name: "Stephanie Fonseca", text: "Customer service was professional, and he did an excellent job cleaning both the inside and outside of my car. Definitely recommend if you're looking for quality work and reliable service." },
  { name: "Kerry Navarro", text: "I finally got it together and had Gloss Spot come over to detail my car top to bottom and I could not be happier! Excellent customer service, professional from start to finish." },
  { name: "Karen West", text: "They did a great job. Loved that they came to my house. They even brought their own water supply. Would highly recommend." },
  { name: "Saad Aqeel", text: "Great experience overall! He came to my home for car detailing and did an amazing job. Very professional, on time, and paid attention to every detail." },
  { name: "Victoria Todd", text: "Saved me hours of cleaning and did 20 times better than I ever could on my own. Very convenient coming to wherever you are. Got it done while at work so I drove off after my shift with it spotless and smelling great." },
  { name: "Kim Pillischafske", text: "The young man who detailed my car inside and out did an amazing job! I only wish I wasn't driving it to NC, because it will be covered in yellow pollen!" },
  { name: "Ravie Ezeoke", text: "Did a wonderful job cleaning our car! He was very flexible and accommodating to us." },
  { name: "Nathan", text: "Dom is a cool guy. Super helpful and did a great job on my vehicle." },
  { name: "Olivia Schrader", text: "I am really glad I decided to get my car detailed by The Gloss Spot! They did an amazing job cleaning up my car." },
  { name: "Mason McCaffrey", text: "Amazing work from these guys. Made my car look literally brand new!" },
  { name: "Amere Brown", text: "Very great detail, these guys exceeded my expectations and I will definitely keep letting them detail my car." },
  { name: "Ella Tangen", text: "My car looks brand new. They did such a great job. I would totally recommend and use them again!" },
  { name: "Doug Bartlett Jr", text: "Very nice job! Great communication and easy to work with. Definitely recommend." },
  { name: "Chris Ebisuya", text: "These guys do a great job! They come to you, my car gets cleaned while I'm at work." },
  { name: "Landon Natschke", text: "100% recommend. They did my interior and exterior in Mahomet." },
  { name: "Nico Micele", text: "Full service detailing, straight to my home in Champaign. They did amazing!" },
  { name: "Dayo Hunley", text: "Had the full detail done and would definitely recommend to others." },
  { name: "Guan Zhiyuan", text: "They did a great job on cleaning my car and it looked like a brand new one. Nice people with great service." },
  { name: "Felix Alejandro", text: "Excellent job. My car looks like new." },
  { name: "Ron Thiele", text: "Very satisfied with the work done detailing the car's interior." },
  { name: "Bross", text: "Great work in good time. Can't go wrong with the Gloss Spot." },
  { name: "Kylia Pierson", text: "Very efficient and know what they are doing. Money well spent!" },
  { name: "Gary Pierson", text: "Fast! Convenient! And friendly service." },
  { name: "Krystal Jackson", text: "These young men did a wonderful job on my car!" },
  { name: "Mary Kelly", text: "Service was really good!" },
  { name: "Jackson Biddle", text: "Does a great job." },
  { name: "Ace", text: "10/10 would recommend to anyone." },
  { name: "KillaKaw", text: "Did a good job at a reasonable price. I recommend!" },
];

// ── Shared copy ─────────────────────────────────────────────────────────────
export const story = {
  heading: "Started in a driveway. Now in our own shop.",
  text: [
    "Dom started detailing out of his car about seven years ago, one driveway at a time.",
    "His brother Dylan joined, the regulars kept coming back, and the work outgrew the trunk.",
    "Today we run our own shop at 606 N. Country Fair Dr, and every car still gets checked by Dom or Dylan before it leaves.",
  ],
};

export const howItWorks = [
  { icon: "calendar", title: "Book", text: "Pick a service, your vehicle and a time. About 30 seconds." },
  { icon: "key", title: "Drop off", text: "Pull into 606 N. Country Fair Dr. You'll talk to Dom." },
  { icon: "sparkle", title: "Pick up shining", text: "Every car gets checked by Dom or Dylan before it leaves." },
];

export const areaLine = "Drivers come in from Urbana, Savoy, Mahomet, Rantoul and all over Champaign County.";

// ── FAQ banks ───────────────────────────────────────────────────────────────
export const faqs = {
  home: [
    ["Where is The Gloss Spot?", "Our shop is at 606 N. Country Fair Dr, Champaign, IL. Tap Get Directions at the bottom of any page."],
    ["How much is a car detail in Champaign?", "An Express Detail starts at $90, a Full Detail at $225 and the Lux Package at $325. Your price depends on vehicle size and shows instantly when you book."],
    ["How do I book?", "Tap Book Now, pick a service, your vehicle and a time, then add your name and phone. Prefer to talk? Call or text 217-600-2108."],
    ["Do you still do mobile detailing?", "We've moved into our own shop so every car gets good light, clean water and the right tools. Drop it off, and we'll text you when it's ready."],
    ["Who will work on my car?", "Dom and Dylan run the shop. One of us checks every car before it leaves."],
  ],
  detailing: [
    ["How much is a full detail in Champaign?", "A Full Detail is $225 for a coupe, $250 for a sedan, $285 for an SUV or truck and $315 for a large 3-row SUV."],
    ["How long does a car detail take?", "An Express takes about an hour and a Full Detail about three. A Lux Package with paint correction takes most of the day."],
    ["What's the difference between Express, Full and Lux?", "Express is a quick vacuum, wipe-down and exterior wash. Full is a complete interior and exterior detail, and Lux adds one-step paint correction and sealant."],
    ["Is mobile detailing better than a shop?", "A shop gives your car steady lighting, controlled water and no weather delays. It's the reason we moved off the driveway."],
    ["Do I need to clean out my car first?", "Just take out valuables and anything you don't want moved. We handle the rest."],
  ],
  ceramic: [
    ["How long does ceramic coating last?", "We offer 3-year, 6-year and 10-year coatings. Regular hand washes keep it performing its best for the full term."],
    ["How much is ceramic coating in Champaign?", "A 3-year coating starts at $1,100 for a coupe, $1,350 for a sedan, $1,600 for an SUV or truck and $1,850 for a minivan or large SUV."],
    ["Is paint correction included with ceramic coating?", "Yes. Every ceramic package includes paint correction, so the coating locks in a corrected finish."],
    ["Is ceramic coating better than wax?", "Wax lasts weeks. Ceramic bonds to your paint and lasts years, with easier washes the whole time."],
    ["How long will you need my car?", "Coating takes prep, correction and cure time, so plan to leave it with us. You'll get an exact pickup time when you book."],
    ["When can I wash my car after ceramic coating?", "We'll give you the cure time at pickup. After that, a pH-neutral hand wash keeps it slick."],
  ],
  correction: [
    ["What is paint correction?", "Machine polishing that removes swirls, light scratches and haze from your clear coat. It brings back depth and gloss that washing can't."],
    ["How much is paint correction in Champaign?", "One-step correction comes in our Lux Package, $325 to $450 by vehicle size, with a full detail and sealant. Two-step correction is +$100."],
    ["What's the difference between one-step and two-step correction?", "One-step is a single polish that clears light swirls and haze. Two-step adds a heavier cut first for deeper defects."],
    ["Can paint correction remove all scratches?", "It removes defects that sit in the clear coat. Dom will look at your paint and tell you what to expect before starting."],
    ["Should I ceramic coat after paint correction?", "It's the ideal time, and every ceramic package already includes correction."],
  ],
  ppf: [
    ["How much is PPF in Champaign, IL?", "For a sedan: Essentials $800 to $1,000, Track Pack $1,900 to $2,500 and Full Body $4,000 to $5,500. Larger vehicles get a custom quote."],
    ["What does paint protection film protect against?", "Rock chips, road debris, light scratches and bug or bird etching on the panels it covers."],
    ["Should I get PPF or ceramic coating?", "PPF is a physical film that takes the hit from rock chips. Ceramic adds gloss and easy washing, and many owners do both."],
    ["Which PPF package is right for me?", "Send a photo and tell us how you drive. Dom will walk you through exactly what each package covers on your car."],
    ["Can you see paint protection film?", "Quality clear film is hard to spot once it's installed. It keeps your factory paint looking like factory paint."],
  ],
  wraps: [
    ["How much does a car wrap cost in Champaign?", "Coupes and sedans are $2,400 to $2,700, SUVs and crossovers $2,900 to $3,200 and full-size trucks or large SUVs $3,300 to $3,600."],
    ["Can you wrap part of my car?", "Yes. Partial wraps start at $800. Tell us what you have in mind and send a photo."],
    ["Do you wrap vans and Sprinters?", "Yes. Cargo vans and Sprinters get a custom quote."],
    ["Are there extra fees for a wrap?", "Specialty finishes add $400 to $600 and old wrap removal is $500 to $800. Prep and edge resealing of $150 to $350 may apply."],
    ["Does a vinyl wrap protect my paint?", "While it's on, the wrap shields your paint from sun and light scratches."],
  ],
  membership: [
    ["How much is a car wash membership in Champaign?", "Exterior Maintenance is $149 a month for 4 exterior details, one every week. The full Gloss Membership is $299 a month and adds 4 interior cleans."],
    ["What's the difference between the two plans?", "Exterior Maintenance covers the outside only. The Gloss Membership adds weekly wax and an interior clean every week."],
    ["How do I start a membership?", "Tap Start Membership or call 217-600-2108. Dom will set up your weekly day and time."],
    ["Do I have to book every visit?", "No. We set a regular weekly time with you, so it just happens."],
    ["Who is the membership for?", "Commuters, families and anyone who wants a clean car every week without thinking about it."],
    ["Does the membership include paint correction?", "It's built for upkeep. For a deeper reset, start with a Full Detail or Lux Package, then keep it there."],
  ],
};

// ── City data for the area pages ────────────────────────────────────────────
// minutes = approximate drive to the shop. route = how most people get here.
export const cities = [
  { slug: "urbana", name: "Urbana", minutes: 12, route: "Springfield Ave west", note: "Drop off on your way to campus or work and we'll text you when it's ready." },
  { slug: "savoy", name: "Savoy", minutes: 15, route: "Neil St or Dunlap Ave north", note: "A quick run up from Savoy, with easy in-and-out parking at the shop." },
  { slug: "mahomet", name: "Mahomet", minutes: 15, route: "I-74 east", note: "Mahomet regulars hop on I-74 and are here before the coffee cools." },
  { slug: "rantoul", name: "Rantoul", minutes: 25, route: "I-57 south to I-74", note: "Make one trip down I-57 and leave with the whole car done." },
  { slug: "st-joseph", name: "St. Joseph", minutes: 20, route: "I-74 west", note: "Straight shot down I-74 from St. Joe." },
  { slug: "tolono", name: "Tolono", minutes: 20, route: "US-45 north", note: "Come up US-45 and pull right into the bay." },
  { slug: "philo", name: "Philo", minutes: 25, route: "Philo Rd north into Urbana", note: "Philo drivers make the trip for full details and protection work." },
  { slug: "sidney", name: "Sidney", minutes: 25, note: "An easy country drive in, a gloss finish on the way home." },
  { slug: "ogden", name: "Ogden", minutes: 25, route: "I-74 west", note: "Head west on I-74 and we'll take it from there." },
  { slug: "fisher", name: "Fisher", minutes: 30, note: "Fisher folks bring trucks and family haulers in for full resets." },
  { slug: "thomasboro", name: "Thomasboro", minutes: 20, route: "US-45 south", note: "A short trip down US-45 from Thomasboro." },
  { slug: "monticello", name: "Monticello", minutes: 25, route: "I-72 east", note: "Monticello drivers come up I-72 for ceramic and full details." },
  { slug: "danville", name: "Danville", minutes: 40, route: "I-74 west", note: "Worth the drive for ceramic, PPF and wraps. One drop-off, handed back finished." },
  { slug: "decatur", name: "Decatur", minutes: 50, route: "I-72 east", note: "Decatur owners make the trip for coatings and paint correction." },
  { slug: "bloomington", name: "Bloomington", minutes: 50, route: "I-74 east", note: "Bloomington drivers come down I-74 for protection work that lasts years." },
  { slug: "normal", name: "Normal", minutes: 50, route: "I-74 east", note: "From Normal, it's I-74 most of the way. Plan a drop-off and a pickup." },
  { slug: "mattoon", name: "Mattoon", minutes: 50, route: "I-57 north", note: "Mattoon drivers bring cars up I-57 for ceramic, PPF and wraps." },
  { slug: "kankakee", name: "Kankakee", minutes: 70, route: "I-57 south", note: "A longer drive that pays off for coatings, film and full wraps." },
  { slug: "springfield", name: "Springfield", minutes: 80, route: "I-72 east", note: "Springfield owners plan a day trip for ceramic coating and wraps." },
  { slug: "peoria", name: "Peoria", minutes: 85, route: "I-74 east", note: "Peoria drivers come down I-74 for multi-year protection work." },
  { slug: "charleston", name: "Charleston", minutes: 55, route: "IL-16 to I-57 north", note: "From Charleston and EIU, it's a straight shot up I-57." },
  { slug: "effingham", name: "Effingham", minutes: 70, route: "I-57 north", note: "Effingham drivers bring their cars up I-57 for ceramic and PPF." },
];

// ── Blog posts (rewritten for the shop) ─────────────────────────────────────
export const posts = [
  {
    slug: "ceramic-vs-wax",
    title: "Ceramic Coating vs. Wax: Which Is Worth It?",
    metaTitle: "Ceramic Coating vs Wax – Champaign, IL | The Gloss Spot",
    description: "Ceramic coating vs. wax, explained in two minutes by a Champaign, IL detail shop. Real prices, real lifespans. Book or call 217-600-2108.",
    h1: "Ceramic Coating vs. Wax in Champaign, IL",
    date: "2026-10-01",
    excerpt: "Wax lasts weeks. Ceramic lasts years. Here's how to pick.",
    body: [
      ["h2", "The short answer"],
      ["p", "Wax is a thin layer that sits on your paint and wears off in weeks. Ceramic coating bonds to your paint and lasts years."],
      ["h2", "Wax: good for"],
      ["ul", ["A quick shine before a weekend", "Older cars you're selling soon", "Tight budgets: our Full Detail includes a quick sealant"]],
      ["h2", "Ceramic: good for"],
      ["ul", ["Cars you plan to keep 3+ years", "Dark paint that shows swirls", "Owners who want easy, fast washes"]],
      ["h2", "What it costs here"],
      ["p", "Our ceramic coating starts at $1,100 for a coupe with a 3-year coating, and paint correction is included in every package. See every size and tier on the <a href=\"/ceramic\">ceramic coating page</a>."],
      ["h2", "The salt-belt factor"],
      ["p", "Central Illinois winters mean road salt and brine. A coated car rinses clean faster, so the salt spends less time on your paint."],
    ],
  },
  {
    slug: "detailing-cost",
    title: "How Much Does Car Detailing Cost in Champaign?",
    metaTitle: "Car Detailing Cost in Champaign, IL (2026) | The Gloss Spot",
    description: "Real 2026 car detailing prices in Champaign, IL, from a $90 Express to ceramic coating, PPF and wraps. Book online or call 217-600-2108.",
    h1: "Car Detailing Cost in Champaign, IL",
    date: "2026-10-01",
    excerpt: "Every price we charge, by vehicle size. No surprises.",
    body: [
      ["h2", "Detailing packages"],
      ["table", [["", "Coupe", "Sedan", "SUV / Truck", "3-Row SUV"], ["Express", "$90", "$100", "$120", "$145"], ["Full Detail", "$225", "$250", "$285", "$315"], ["Lux Package", "$325", "$350", "$400", "$450"]]],
      ["p", "Lux includes one-step paint correction and sealant. Two-step correction is +$100."],
      ["h2", "Protection"],
      ["ul", ["Ceramic coating: from $1,100 (paint correction included)", "Paint protection film: from $800 for a sedan", "Vehicle wraps: from $2,400, partial wraps from $800"]],
      ["h2", "Membership"],
      ["p", "Exterior Maintenance is $149 a month for a weekly exterior detail. The $299 Gloss Membership adds weekly wax and 4 interior cleans. Details on the <a href=\"/membership\">membership page</a>."],
      ["h2", "Why prices vary by size"],
      ["p", "A 3-row SUV has more seats, more carpet and more paint. You'll always see your exact price before you book."],
    ],
  },
  {
    slug: "how-often",
    title: "How Often Should You Detail Your Car?",
    metaTitle: "How Often to Detail a Car – Champaign, IL | Gloss Spot",
    description: "How often to detail your car in Champaign, IL, based on how you drive and Illinois winters. Book a detail online or call 217-600-2108.",
    h1: "How Often to Detail Your Car in Champaign, IL",
    date: "2026-10-01",
    excerpt: "A simple schedule based on how you actually use your car.",
    body: [
      ["h2", "A simple rule"],
      ["ul", ["Full Detail: 2 to 4 times a year", "Express Detail: every month or two", "Ceramic coating: once, then maintenance washes"]],
      ["h2", "Detail more often if"],
      ["ul", ["You have kids, pets or a work truck", "You park outside or under trees", "You drive a lot of highway miles"]],
      ["h2", "Time it with the seasons"],
      ["p", "In Champaign County, a Full Detail in late fall preps your car for salt. Another in spring washes winter off for good."],
      ["h2", "Want it handled?"],
      ["p", "A <a href=\"/membership\">membership from $149/month</a> keeps your car clean every week. Or <a href=\"/packages\">book a detail</a> when you need one."],
    ],
  },
  {
    slug: "mobile-vs-shop",
    title: "Mobile Detailing vs. Shop Detailing: Why We Moved",
    metaTitle: "Mobile Detailing vs Shop – Champaign, IL | The Gloss Spot",
    description: "Why we moved from mobile detailing to our own Champaign, IL shop, and what it means for your car. Book online or call 217-600-2108.",
    h1: "Mobile Detailing vs. a Shop in Champaign, IL",
    date: "2026-10-01",
    excerpt: "We spent years in driveways. Here's why we moved into a shop.",
    body: [
      ["h2", "Where we started"],
      ["p", "Dom detailed out of his car for years, in driveways and parking lots all over Champaign County. It built the business, and the regulars."],
      ["h2", "What a shop adds"],
      ["ul", ["Steady lighting to see every swirl", "Controlled water and power", "No rain-outs or wind blowing dust onto wet paint", "Room for paint correction, ceramic, PPF and wraps"]],
      ["h2", "What stays the same"],
      ["p", "You still talk to Dom. Every car still gets checked by Dom or Dylan before it leaves."],
      ["h2", "Is drop-off a hassle?"],
      ["p", "Most people drop off on the way to work and pick up on the way home. We'll text you when it's ready. <a href=\"/mobile-detailing-champaign-il\">See how it works</a>."],
    ],
  },
];
