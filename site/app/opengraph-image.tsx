import { ImageResponse } from "next/og";
export const alt = "Gvozdik studio — фото и видео для брендов женской одежды";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{width:"100%",height:"100%",background:"#f5f3ec",color:"#282923",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:60}}><div style={{display:"flex",justifyContent:"space-between",fontSize:22}}><span>FASHION PHOTO & VIDEO</span><span>MINSK, BELARUS</span></div><div style={{fontSize:185,letterSpacing:-12,display:"flex",alignItems:"baseline"}}>gvozdik<span style={{fontSize:50,letterSpacing:-2,marginLeft:25}}>studio</span></div><div style={{borderTop:"1px solid #cecec1",paddingTop:24,fontSize:22}}>ALENA GVOZDIK / @GWOZDIK</div></div>, size);
}
