import { _decorator, Component, Camera, RenderTexture, Animation, CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScreenshotController')
export class ScreenshotController extends Component {

    @property(Camera)
    private screenshotCamera:Camera|null = null; //只照GAME層的相機(無UI)
    @property({type:Animation})
    private tipAnim:Animation|null = null;
    @property({type:CCInteger, min:1})
    private tipTimeLength:number = 1;

    start() {}

    update(deltaTime: number) {}

    //截圖按鈕
    onScreenshotClick()
    {
        //截圖相機的targetTexture
        let rt:RenderTexture|null = this.screenshotCamera.targetTexture;
        if(!rt){
            return;
        }
        //RenderTexture轉換成canvas圖片
        let [w, h] = [rt.width, rt.height];
        let px = rt.readPixels();
        let canvas = document.createElement('canvas');
        [canvas.width, canvas.height] = [w, h];
        let ctx = canvas.getContext('2d');
        let img = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let src_id = ((h - y - 1) * w + x) * 4;
                let dst_id = (y * w + x) * 4;
                img.data.set(px.slice(src_id, src_id + 4), dst_id);
            }
        }
        ctx.putImageData(img, 0, 0);
        canvas.toBlob(
            //複製到剪貼簿(因用到this.tipAnim改用箭頭函式)
            async (_blob:Blob) => {
                if(_blob){
                    await navigator.clipboard.write([new ClipboardItem({'image/png':_blob})]);
                    //等待複製成功播放提示
                    if(this.tipAnim){
                        let state = this.tipAnim.getState('fadeOut');
                        state.speed = state.duration / this.tipTimeLength;
                        this.tipAnim.play('fadeOut');
                    }
                }
            }
            , 'image/png');
    }
}


