// Tokens copied 1:1 from assets/theme.ts, constants/spacing.ts, constants/borderRadius.ts
const light = {
  primary:'#000000', onPrimary:'#ffffff', primaryContainer:'#000000', onPrimaryContainer:'#ffffff',
  secondary:'#DF442E', onSecondary:'#ffffff', secondaryContainer:'#FADEBC', onSecondaryContainer:'#56442A',
  tertiary:'#644fab', onTertiary:'#ffffff', tertiaryContainer:'#e7deff', onTertiaryContainer:'#463D66',
  nature:'#0F995D', onNature:'#ffffff',
  error:'#ba1a1a', onError:'#0b0202', errorContainer:'#ffdad6', onErrorContainer:'#410002',
  background:'#FFFCF5', onBackground:'#1e1b16', surface:'#FFEDC8', onSurface:'#1e1b16',
  surfaceVariant:'#FFF5E0', onSurfaceVariant:'#4d4639', outline:'#7e7667', outlineVariant:'#d0c5b4',
  inverseSurface:'#33302a', inverseOnSurface:'#f7f0e7', inversePrimary:'#f0c048',
  // elevation.level1..5 = hsla(40,100%,98/96/94/92/90%) -> hex
  elev1:'#FFFCF5', elev2:'#FFF8EB', elev3:'#FFF5E0', elev4:'#FFF1D6', elev5:'#FFEECC',
  onSurfaceDisabled:'rgba(30,27,22,.38)', surfaceDisabled:'rgba(30,27,22,.12)', backdrop:'rgba(54,48,36,.4)',
};
const dark = {
  primary:'#f0c048', onPrimary:'#1e1b16', primaryContainer:'#4d4738', onPrimaryContainer:'#f7f0e7',
  secondary:'#FF5C42', onSecondary:'#1e1b16', secondaryContainer:'#56442A', onSecondaryContainer:'#FADEBC',
  tertiary:'#9b7fff', onTertiary:'#1e1b16', tertiaryContainer:'#463D66', onTertiaryContainer:'#e7deff',
  nature:'#0F995D', onNature:'#1e1b16',
  error:'#ffb4ab', onError:'#690005', errorContainer:'#93000a', onErrorContainer:'#ffdad6',
  background:'#1e1b16', onBackground:'#e8e2d9', surface:'#2d2a23', onSurface:'#e8e2d9',
  surfaceVariant:'#3d3a33', onSurfaceVariant:'#cdc5b4', outline:'#968e7e', outlineVariant:'#4d4639',
  inverseSurface:'#e8e2d9', inverseOnSurface:'#33302a', inversePrimary:'#000000',
  elev1:'#2d2a23', elev2:'#35322b', elev3:'#3d3a33', elev4:'#45423b', elev5:'#4d4a43',
  onSurfaceDisabled:'rgba(232,226,217,.38)', surfaceDisabled:'rgba(232,226,217,.12)', backdrop:'rgba(54,48,36,.4)',
};
const kebab = s => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
const cssVars = t => Object.entries(t).map(([k,v])=>`--${kebab(k)}:${v};`).join('');
function hex2rgb(h){h=h.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function lum([r,g,b]){const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b);}
function ratio(a,b){const la=lum(hex2rgb(a)),lb=lum(hex2rgb(b));const [x,y]=la>lb?[la,lb]:[lb,la];return (x+.05)/(y+.05);}
module.exports={light,dark,cssVars,ratio};
