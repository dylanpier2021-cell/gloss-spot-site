// Background video loops made in OpenArt (PixVerse V6) from our REAL photos.
// Each `from` names the original photo that was animated. Loops are hosted on
// OpenArt's CDN; for long-term safety, download them and upload to Cloudinary,
// then swap the URLs here and run `npm run build`.
const V = "https://cdn.openart.ai/openart-ai/production/2026-10/create-video/cMsgRdDVyjzN24ccys4i/";
const T = "https://cdn.openart.ai/openart/thumbnail/production/2026-10/create-video/cMsgRdDVyjzN24ccys4i/";

export default {
  // Homepage hero: our real detailing video from the original site (Cloudinary).
  // Plays on desktop and phones. Swap the URL to change it.
  heroDesktop: {
    from: "Real Gloss Spot video (snaptik_7606341937959816461)",
    mp4: "https://res.cloudinary.com/djp1yfsj5/video/upload/a_270/snaptik_7606341937959816461_hd_zo0wjl.mp4",
  },
  heroMobile: null,
  // OpenArt push-in loops made from our real car photos (spare; not on the
  // homepage). IMG_7154 landscape / IMG_7383 portrait.
  carLoopWide: {
    from: "IMG_7154.jpg",
    mp4: V + "3455e777-26b0-4f75-9369-2a4227752c94_seed2037739309_1790850172315_686e4bde.mp4",
  },
  carLoopTall: {
    from: "IMG_7383.jpg",
    mp4: V + "c9143183-8495-4863-bd12-0857207990c2_seed983236744_1790850364273_f50a487b.mp4",
  },
  // Story section: slow push toward our bay door (02-bay-garage-door-wide).
  shop: {
    from: "02-bay-garage-door-wide.jpg",
    mp4: V + "33baa495-17ae-4245-8ea1-555435c0d50e_seed509419221_1790850357734_8079a3e3.mp4",
    poster: T + "pixverse_mp4_media_web_ori_33baa495-17ae-4245-8ea1-555435c0d50e_seed509419221_1790850361357_3e56f030.webp",
  },
  // "How it works" background: slow dolly through our main floor (03-main-floor).
  shopFloor: {
    from: "03-main-floor.jpg",
    mp4: V + "22ffe670-108d-4eae-9e89-d2309f1fa4ff_seed345066326_1790851018822_9e4a8468.mp4",
    poster: T + "pixverse_mp4_media_web_ori_22ffe670-108d-4eae-9e89-d2309f1fa4ff_seed345066326_1790851021707_2a253fcd.webp",
  },
  // Membership banner background: our real black Yukon clip.
  memberCar: { from: "black-yukon.mp4 (real customer car)", mp4: "/media/black-yukon.mp4" },
  // Spare OpenArt push-in on IMG_7337 (no longer used).
  memberCarOpenArt: {
    from: "IMG_7337.jpg",
    mp4: V + "9b4f29d5-9109-42d6-a96f-beb5a9228004_seed694486191_1790851026298_b4389d26.mp4",
    poster: T + "pixverse_mp4_media_web_ori_9b4f29d5-9109-42d6-a96f-beb5a9228004_seed694486191_1790851028558_5f879f82.webp",
  },
  // Abstract texture loops (no cars), made from text prompts. Only used as
  // fallbacks if a real-photo loop above is removed.
  beading: {
    from: "text prompt (water beading on gloss black)",
    mp4: V + "2e1807cd-2cd4-42f8-982f-7dc8861e587e_seed1946236916_1790849916320_5f17bfaf.mp4",
    poster: T + "pixverse_mp4_media_web_ori_2e1807cd-2cd4-42f8-982f-7dc8861e587e_seed1946236916_1790849918880_45911244.webp",
  },
  foam: {
    from: "text prompt (snow foam on gloss black)",
    mp4: V + "4d564228-a881-43b6-98f0-3d086fe176e5_seed1706505707_1790849984392_fcc9dcab.mp4",
    poster: T + "pixverse_mp4_media_web_ori_4d564228-a881-43b6-98f0-3d086fe176e5_seed1706505707_1790849987669_9faeefdb.webp",
  },
  lightSweep: {
    from: "text prompt (cyan light sweep on gloss black)",
    mp4: V + "5a307d98-a3dc-4dbf-9a67-aa9a440f94d6_seed496048357_1790849924594_604c8bd5.mp4",
    poster: T + "pixverse_mp4_media_web_ori_5a307d98-a3dc-4dbf-9a67-aa9a440f94d6_seed496048357_1790849926893_e159c229.webp",
  },
};
