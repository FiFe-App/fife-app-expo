const {light,dark,cssVars}=require('./tokens');
module.exports = `
:root{
  /* constants/spacing.ts */
  --sp-none:0px;--sp-xs:4px;--sp-sm:8px;--sp-md:12px;--sp-lg:16px;--sp-xl:20px;--sp-xxl:24px;--sp-xxxl:32px;
  /* constants/borderRadius.ts */
  --r-none:0px;--r-xs:4px;--r-sm:6px;--r-md:8px;--r-lg:12px;--r-xl:16px;--r-pill:30px;--r-full:1000px;
}
.theme-light{${cssVars(light)}color-scheme:light}
.theme-dark{${cssVars(dark)}color-scheme:dark}

*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:"RedHatText",system-ui,sans-serif;background:#d8d3c7;color:#1e1b16;min-width:390px}
@media (prefers-color-scheme:dark){body{background:#0f0e0b;color:#e8e2d9}}
code{font-family:ui-monospace,Menlo,monospace;font-size:.92em;background:rgba(127,127,127,.18);padding:0 4px;border-radius:3px}

/* ---------- oldal (nem része a terveknek) ---------- */
.page{max-width:1000px;margin:0 auto;padding:24px 0 48px}
.page>header{padding:0 16px 8px}
.page h1{font:800 26px/1.2 "Piazzolla-ExtraBold",serif}
.page .lead{font-size:14px;line-height:1.5;margin-top:6px;opacity:.85;max-width:62ch}
.row{margin-top:36px}
.row>h2{font:800 19px/1.25 "Piazzolla-ExtraBold",serif;padding:0 16px}
.row>.note{font-size:13px;line-height:1.5;padding:4px 16px 12px;max-width:80ch;opacity:.85}
.pair{display:flex;flex-wrap:wrap;gap:24px;justify-content:center;align-items:flex-start}
figure{width:390px;flex:none}
figcaption{font-size:12px;padding:6px 4px 8px;opacity:.7;text-align:center}

/* ---------- telefon-keret ---------- */
.frame{position:relative;width:390px;height:844px;overflow:hidden;border-radius:28px;display:flex;flex-direction:column;
  background:var(--background);color:var(--on-surface);box-shadow:0 0 0 1px rgba(0,0,0,.25),0 8px 24px rgba(0,0,0,.18)}
.crop{position:relative;width:390px;overflow:hidden;border-radius:12px;background:var(--background);color:var(--on-surface);box-shadow:0 0 0 1px rgba(0,0,0,.25)}
.sbar{flex:none;height:24px;background:var(--surface);display:flex;align-items:center;justify-content:space-between;padding:0 16px;font:500 12px/1 "RedHatText-Medium",sans-serif;color:var(--on-surface)}
.sbar .ico{display:flex;gap:6px;align-items:center}
.sbar .ico i{display:block;width:12px;height:12px;border-radius:3px;background:var(--on-surface);opacity:.8}
.sbar .ico i:first-child{border-radius:6px 6px 1px 6px}
.screen{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;background:var(--background)}
.scroll{flex:1;min-height:0;overflow:hidden;position:relative}
svg.mdi{flex:none;display:block}

/* ---------- tipográfia: assets/theme.ts fontConfig (mobil <=600 px) ---------- */
.t-body{font:300 17px/24px "RedHatText-Light",sans-serif;letter-spacing:.25px}
.t-body-s{font:400 10px/18px "RedHatText",sans-serif;letter-spacing:.4px}
.t-default{font:400 12px/22px "RedHatText",sans-serif;letter-spacing:.5px}
.t-title-s{font:800 14px/20px "Piazzolla-ExtraBold",serif;letter-spacing:.1px}
.t-title-m{font:800 16px/24px "Piazzolla-ExtraBold",serif;letter-spacing:.15px}
.t-title-l{font:800 22px/28px "Piazzolla-ExtraBold",serif}
.t-head-l{font:400 28px/40px "Piazzolla-Regular",serif}
.t-label-l{font:700 16px/20px "RedHatText-Bold",sans-serif;letter-spacing:.1px}
.t-label-m{font:500 12px/16px "RedHatText-Medium",sans-serif;letter-spacing:.5px}
.t-label-s{font:500 11px/16px "RedHatText-Medium",sans-serif;letter-spacing:.5px}
.c-var{color:var(--on-surface-variant)}
.c-sec{color:var(--secondary)}
.c-pri{color:var(--primary)}
.c-bg{color:var(--on-background)}

/* ---------- Appbar (MyAppBar) ---------- */
.appbar{flex:none;height:64px;background:var(--surface);display:flex;align-items:center;width:100%}
.appbar .slot{width:48px;height:48px;display:flex;align-items:center;justify-content:center;flex:none;color:var(--on-surface)}
.appbar .ttl{flex:1;font:800 20px/28px "Piazzolla-ExtraBold",serif;color:var(--on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.appbar .center{flex:1;min-width:0;display:flex;align-items:center;gap:var(--sp-md);background:var(--surface)}
.fake-search{flex:1;min-width:0;height:40px;border-radius:var(--r-full);background:var(--background);display:flex;align-items:center;padding:0 var(--sp-md);gap:var(--sp-sm);color:var(--on-surface)}
.fake-search .txt{flex:1;text-align:center;font:300 12px/22px "RedHatText";letter-spacing:.5px;color:var(--on-surface-variant);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fake-search .txt.val{text-align:left;color:var(--on-surface)}
.smiley{width:35px;height:35px;border-radius:var(--r-xs);flex:none;display:block}

/* ---------- gombok (Button.tsx + Paper) ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 24px;border-radius:var(--r-full);border:1px solid transparent;font:800 16px/20px "Piazzolla-ExtraBold",serif;letter-spacing:.1px;white-space:nowrap;background:none}
.btn.icon{padding-left:16px}
.btn.contained{background:var(--primary);color:var(--on-primary)}
.btn.tonal{background:var(--secondary-container);color:var(--on-secondary-container)}
.btn.outlined{border-color:var(--outline);color:var(--primary)}
.btn.text{color:var(--primary);padding:0 12px}
.btn.err{color:var(--error)}
.btn.big{height:50px;border-radius:var(--r-pill);width:100%}
.btn.h56{height:56px;border-radius:var(--r-lg);font-family:"RedHatText-Bold";font-weight:700}
.btn.block{width:100%}
.btn.dis{background:var(--surface-disabled);color:var(--on-surface-disabled);border-color:transparent}
.btn.sm{height:44px;padding:0 12px;font-size:14px}
.iconbtn{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:var(--r-full);color:var(--on-surface-variant);flex:none}

/* ---------- Chip (Paper) + CategoryChip ---------- */
.chip{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border-radius:var(--r-full);border:1px solid var(--outline-variant);background:transparent;color:var(--on-surface-variant);font:700 14px/20px "RedHatText-Bold";letter-spacing:.1px;white-space:nowrap;position:relative;flex:none}
.chip.sel{background:var(--secondary-container);color:var(--on-secondary-container);border-color:transparent}
.chip.icon{padding-left:8px}
.chip::after{content:"";position:absolute;left:0;right:0;top:-6px;bottom:-6px} /* hitSlop 6 -> 44 px magas érintési felület */
.chip.dashed{border-style:dashed;border-color:var(--outline);border-radius:var(--r-md)}
.chip.md{border-radius:var(--r-md)}
.cat{display:inline-flex;align-items:center;padding:var(--sp-xs);border-radius:var(--r-md);background:var(--surface);color:var(--on-background);font:500 12px/16px "RedHatText-Medium";letter-spacing:.5px}
.cat.match{background:var(--secondary-container);color:var(--on-secondary-container)}
.cat.new{background:var(--tertiary);color:var(--on-tertiary)}
.tags{display:flex;flex-wrap:wrap;gap:var(--sp-xs)}
.tag-edit{display:inline-flex;align-items:center;background:var(--secondary-container);border-radius:var(--r-md);padding:4px 36px 4px 12px;position:relative;color:var(--on-secondary-container);font:400 14px/20px "RedHatText";min-height:28px}
.tag-edit .x{position:absolute;right:-8px;top:50%;transform:translateY(-50%);width:44px;height:44px;display:flex;align-items:center;justify-content:center}

/* ---------- MetaStat ---------- */
.stat{display:flex;align-items:center;gap:var(--sp-xs);font:400 12px/22px "RedHatText";letter-spacing:.5px;color:var(--on-surface);min-width:0}
.stats{display:flex;flex-wrap:wrap;gap:var(--sp-sm)}

/* ---------- Surface ---------- */
.form-surf{background:var(--elev1);border-radius:var(--r-lg);padding:var(--sp-lg);display:flex;flex-direction:column;gap:var(--sp-md)}

/* ---------- Kérés kártya ---------- */
.card{background:var(--elev2);border-radius:var(--r-lg);padding:var(--sp-md);display:flex;flex-direction:column;gap:var(--sp-sm);overflow:hidden;position:relative}
.ph{display:flex;align-items:center;gap:var(--sp-sm)}
.ph .who{flex:1;min-width:0}
.ph .name{color:var(--on-background);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph .sub{display:flex;align-items:center;gap:4px;font:400 12px/16px "RedHatText";letter-spacing:.4px;color:var(--on-surface-variant);white-space:nowrap}
.ph .iconbtn{margin:-8px -8px -8px 0}
.avatar{flex:none;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font:800 15px/1 "Piazzolla-ExtraBold",serif;overflow:hidden}
.clamp3,.clamp5{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;color:var(--on-background)}
.clamp3{-webkit-line-clamp:3}.clamp5{-webkit-line-clamp:5}
.cfoot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--outline-variant);margin:var(--sp-xs) calc(-1*var(--sp-md)) calc(-1*var(--sp-md));padding:0 var(--sp-md);min-height:44px}
.badge-solved{display:inline-flex;align-items:center;gap:4px;padding:2px 8px 2px 6px;border-radius:var(--r-md);border:1px solid var(--nature);background:rgba(15,153,93,.14);color:var(--on-background);font:500 12px/16px "RedHatText-Medium";letter-spacing:.5px;align-self:flex-start}
.badge-match{display:inline-flex;align-items:center;gap:4px;padding:2px 8px 2px 6px;border-radius:var(--r-md);background:var(--tertiary-container);color:var(--on-tertiary-container);font:500 12px/16px "RedHatText-Medium";letter-spacing:.5px;align-self:flex-start}
.grid{display:grid;gap:2px;border-radius:var(--r-md);overflow:hidden;height:196px;background:var(--outline-variant)}
.grid.g1{grid-template-columns:1fr;height:200px}
.grid.g2{grid-template-columns:1fr 1fr;height:170px}
.grid.g3{grid-template-columns:3fr 2fr;grid-template-rows:1fr 1fr;height:210px}
.grid.g3>:first-child{grid-row:1/3}
.grid.g4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:230px}
.grid>*{position:relative;overflow:hidden;min-width:0;min-height:0}
.ph-img{width:100%;height:100%;display:block}

/* kompakt (home) */
.cards-strip{display:flex;gap:var(--sp-sm);padding:var(--sp-xs) var(--sp-md) var(--sp-sm);overflow:hidden}
.card.compact{width:264px;flex:none;min-height:196px}
.card.compact .ptext{font:300 15px/22px "RedHatText-Light";letter-spacing:.25px}
.endcard{width:116px;flex:none;border-radius:var(--r-lg);background:var(--elev1);border:1px dashed var(--outline);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--sp-sm);padding:var(--sp-md);text-align:center;color:var(--on-background)}
.sec-head{display:flex;align-items:center;justify-content:space-between;padding:0 var(--sp-lg);min-height:44px}
.sec-head .l{display:flex;align-items:flex-end;gap:var(--sp-xs)}
.sec-head .r{display:flex;align-items:center;gap:var(--sp-xs);min-height:44px;padding-left:var(--sp-md)}
.sticky-head{background:var(--background);padding:var(--sp-sm) var(--sp-lg);display:flex;align-items:flex-end;gap:var(--sp-xs)}

/* ---------- Bottom navigation ---------- */
.bnav{flex:none;display:flex;background:var(--elev1);padding-bottom:16px;position:relative;z-index:2;width:100%}
.bnav .b{flex:1;min-width:0;padding:var(--sp-sm);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--on-background)}
.bnav .lbl{font:500 12px/16px "RedHatText-Medium";letter-spacing:.5px;white-space:nowrap}
.bnav .b.on .lbl{font-weight:700;font-family:"RedHatText-Bold"}
.bnav .ic{height:28px;display:flex;align-items:center;justify-content:center}
.bnav .sep{flex:none;width:var(--sp-xxl);display:flex;align-items:center;justify-content:center}
.bnav .sep i{display:block;width:1px;height:36px;background:var(--outline-variant)}
.bnav .ring{border:2px solid transparent;border-radius:5px;padding:2px}
.bnav .ring.on{border-color:var(--primary)}
.badge-n{position:absolute;top:-2px;right:-8px;min-width:16px;height:16px;border-radius:8px;background:var(--error);color:var(--on-error);font:700 10px/16px "RedHatText-Bold";text-align:center;padding:0 4px}

/* ---------- FAB ---------- */
.fab{position:absolute;right:var(--sp-lg);bottom:var(--sp-lg);height:56px;border-radius:var(--r-xl);padding:0 20px 0 16px;display:flex;align-items:center;gap:12px;
  background:var(--tertiary-container);color:var(--on-tertiary-container);font:700 16px/20px "RedHatText-Bold";letter-spacing:.1px;z-index:3}

/* ---------- Menü / Dialog / Scrim ---------- */
.scrim{position:absolute;inset:0;background:var(--backdrop);z-index:20}
.menu{position:absolute;z-index:30;background:var(--elev2);border-radius:var(--r-xs);padding:8px 0;min-width:112px;max-width:280px;box-shadow:0 2px 10px rgba(0,0,0,.28)}
.menu .it{height:48px;display:flex;align-items:center;gap:12px;padding:0 16px;color:var(--on-surface);font:300 17px/24px "RedHatText-Light"}
.menu .it svg{color:var(--on-surface-variant)}
.menu .it.err,.menu .it.err svg{color:var(--error)}
.dialog{position:absolute;z-index:31;left:50%;transform:translate(-50%,-50%);top:50%;width:min(342px,calc(100% - 48px));background:var(--elev3);border-radius:28px;padding:24px 0 0;color:var(--on-surface)}
.dialog h3{font:400 20px/24px "Piazzolla-ExtraBold";padding:0 24px 16px;letter-spacing:0}
.dialog .dc{padding:0 24px 8px;font:300 17px/24px "RedHatText-Light";letter-spacing:.25px;color:var(--on-surface)}
.dialog .da{display:flex;align-items:center;justify-content:flex-end;padding:16px;gap:4px}
.modalcard{position:absolute;z-index:31;left:20px;right:20px;top:50%;transform:translateY(-50%);background:var(--background);border-radius:var(--r-lg);padding:var(--sp-lg);color:var(--on-surface)}
.excerpt{margin-top:var(--sp-sm);padding:var(--sp-sm);border-radius:var(--r-md);border-left:3px solid var(--outline-variant);background:var(--surface-variant);color:var(--on-surface)}
.radio{display:flex;align-items:center;gap:var(--sp-sm);padding:var(--sp-xs) 0;min-height:48px}
.radio .rb{width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex:none}
.radio .rb i{width:20px;height:20px;border-radius:50%;border:2px solid var(--on-surface-variant);display:flex;align-items:center;justify-content:center}
.radio.on .rb i{border-color:var(--primary)}
.radio.on .rb i::after{content:"";width:10px;height:10px;border-radius:50%;background:var(--primary)}
.snack{position:absolute;left:8px;right:8px;z-index:25;background:var(--inverse-surface);color:var(--inverse-on-surface);border-radius:var(--r-xs);min-height:48px;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font:300 17px/24px "RedHatText-Light"}
.snack b{font:700 14px/20px "RedHatText-Bold";color:var(--inverse-primary)}

/* ---------- űrlap ---------- */
.field{position:relative;border:1px solid var(--outline);border-radius:var(--r-xs);padding:20px 12px 10px;color:var(--on-surface);background:transparent}
.field .lab{position:absolute;left:8px;top:-9px;padding:0 4px;background:var(--elev1);font:400 12px/16px "RedHatText";letter-spacing:.4px;color:var(--on-surface-variant)}
.field .val{font:300 20px/28px "RedHatText-Light";letter-spacing:.15px;color:var(--on-surface);min-height:112px}
.field .ph-t{color:var(--on-surface-variant)}
.field.focus{border:2px solid var(--primary);padding:19px 11px 9px}
.field.focus .lab{color:var(--primary)}
.field.bad{border:2px solid var(--error);padding:19px 11px 9px}
.field.bad .lab{color:var(--error)}
.helper{display:flex;justify-content:space-between;gap:8px;font:400 12px/16px "RedHatText";letter-spacing:.4px;color:var(--on-surface-variant);padding-top:2px}
.helper.err{color:var(--error)}
.helper .e{display:flex;gap:4px;align-items:flex-start}
.seclabel{display:flex;align-items:baseline;gap:var(--sp-xs);padding-left:var(--sp-xs)}
.seclabel .t{font:800 16px/24px "Piazzolla-ExtraBold",serif;letter-spacing:.15px;color:var(--on-surface)}
.seclabel .t em{font-style:normal;color:var(--error)}
.seclabel .o{font:400 10px/18px "RedHatText";letter-spacing:.4px;color:var(--on-surface-variant)}
.seclabel .cnt{margin-left:auto;font:500 12px/16px "RedHatText-Medium";color:var(--on-surface-variant);letter-spacing:.5px}
.seg{display:flex;height:40px}
.seg>div{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--outline);font:500 14px/20px "RedHatText-Medium";letter-spacing:.1px;color:var(--on-surface)}
.seg>div+div{border-left:0}
.seg>div:first-child{border-radius:20px 0 0 20px}.seg>div:last-child{border-radius:0 20px 20px 0}
.seg>div.on{background:var(--secondary-container);color:var(--on-secondary-container)}
.thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-sm)}
.thumb{position:relative;aspect-ratio:1;border-radius:var(--r-md);overflow:hidden;background:var(--surface-variant)}
.thumb .del{position:absolute;top:0;right:0;width:44px;height:44px;display:flex;align-items:flex-start;justify-content:flex-end;padding:4px}
.thumb .del i{width:24px;height:24px;border-radius:50%;background:rgba(30,27,22,.78);color:#fff;display:flex;align-items:center;justify-content:center}
.thumb.add{border:1.5px dashed var(--outline);background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--on-surface-variant);font:500 11px/16px "RedHatText-Medium"}
.thumb .ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:rgba(30,27,22,.62);color:#fff;font:700 12px/16px "RedHatText-Bold"}
.thumb .ov.bad{background:var(--error-container);color:var(--on-error-container)}
.spin{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;animation:sp 1s linear infinite}
.spin.l{width:40px;height:40px;border-color:rgba(127,127,127,.3);border-top-color:var(--primary);border-width:4px}
@keyframes sp{to{transform:rotate(360deg)}}
.mapbox{position:relative;border-radius:var(--r-md);overflow:hidden}
.mapbox svg.map{display:block;width:100%;height:100%}
.radius-row{display:flex;gap:var(--sp-sm);flex-wrap:wrap}
.submitbar{flex:none;background:var(--elev2);border-top:1px solid var(--outline-variant);padding:var(--sp-md) var(--sp-lg);display:flex;z-index:3}

/* ---------- Comments mintára ---------- */
.cm{display:flex;align-items:flex-start;gap:var(--sp-sm);padding:var(--sp-md) 0;border-bottom:1px solid var(--outline-variant)}
.cm:last-child{border-bottom:0}
.cm .b{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cm .h{display:flex;align-items:baseline;gap:var(--sp-sm);flex-wrap:wrap}
.cm .n{font:700 14px/20px "RedHatText-Bold";color:var(--on-background)}
.cm .tm{font:400 12px/16px "RedHatText";color:var(--on-surface-variant)}
.cm .tx{font:400 15px/22px "RedHatText";color:var(--on-background)}
.cm .im{width:64px;height:64px;border-radius:var(--r-md);overflow:hidden;flex:none}
.cm .iconbtn{margin:-4px -8px 0 -8px}
.cinput{position:relative;background:var(--surface-variant);border-radius:4px 4px 0 0;border-bottom:1px solid var(--on-surface-variant);height:56px;display:flex;align-items:center;padding:0 100px 0 16px;font:300 17px/24px "RedHatText-Light";color:var(--on-surface-variant)}
.cinput .acts{position:absolute;right:0;top:0;display:flex;height:56px;align-items:center}
.cinput.dis{border-bottom-color:var(--outline-variant)}
.cinput.dis .acts,.cinput.dis .pt{opacity:.5}
.closed-note{display:flex;align-items:flex-start;gap:var(--sp-sm);padding:var(--sp-md);border-radius:var(--r-md);background:var(--surface-variant);color:var(--on-surface);font:400 14px/20px "RedHatText"}
.closed-note svg{color:var(--on-surface-variant)}

/* ---------- Skeleton ---------- */
.sk{border-radius:var(--r-md);background:color-mix(in srgb,var(--outline-variant) 75%,transparent);animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.sk,.spin{animation:none}}

/* ---------- Részletező oldal ---------- */
.gallery{position:relative;border-radius:var(--r-lg);overflow:hidden;height:250px}
.gallery .pill{position:absolute;right:8px;bottom:8px;background:rgba(30,27,22,.78);color:#fff;border-radius:var(--r-full);padding:2px 10px;font:500 12px/16px "RedHatText-Medium";letter-spacing:.5px}
.gallery .peek{position:absolute;right:0;top:0;bottom:0;width:14px;background:linear-gradient(90deg,transparent,rgba(30,27,22,.3))}
.dots{display:flex;gap:6px;justify-content:center;padding-top:8px}
.dots i{width:6px;height:6px;border-radius:50%;background:var(--outline-variant)}
.dots i.on{background:var(--primary);width:16px;border-radius:3px}
.banner{display:flex;align-items:center;gap:var(--sp-md);padding:var(--sp-md) var(--sp-lg);background:rgba(15,153,93,.14);border-bottom:1px solid var(--nature);color:var(--on-background)}
.person{display:flex;align-items:center;gap:var(--sp-md)}
`;
