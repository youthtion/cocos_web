import { _decorator, Component, EventMouse, input, Input, Vec3, Animation, Sprite } from 'cc';
import { JUMP_TIME, HOLD_TIME, BLOCK_SIZE, BlockType, GameModel} from './GameModel'
const { ccclass, property } = _decorator;

const PLAYER_INIT_POS = new Vec3(0, 33, 0); //玩家初始位置

//滑鼠點擊類型(對應event.getButton)
enum EMouseType{
    MT_LEFT, //左鍵
    MT_MID,  //中鍵
    MT_RIGHT,//右鍵
}

@ccclass('PlayerController')
export class PlayerController extends Component {

    //綁定編輯器選擇元件
    @property({type:Animation})
    public bodyAnim:Animation|null = null;
    @property({type:Sprite})
    public body:Sprite|null = null;

    start(){}

    update(_delta_time: number)
    {
        //跳起至落地動畫
        if(this.startJump == true){
            this.curJumpTime += _delta_time;
            //達落地時間
            if(this.curJumpTime > JUMP_TIME){
                this.node.setPosition(this.targetPos);
                //判斷落地失敗
                let road:BlockType[] = GameModel.getRoad();
                if(this.startFall == false && road[GameModel.getCurMoveIdx()] == BlockType.BT_NONE){
                    this.fall(); //繼續掉落
                }
                //落地或失敗動畫結束
                else{
                    this.node.emit('JumpEnd');
                }
            }
            //未達落地時間持續更新位置
            else if(this.startFall == false){
                this.node.getPosition(this.curPos);
                this.deltaPos.x = this.curJumpSpeed * _delta_time; //位移量=平移速度x經過時間
                Vec3.add(this.curPos, this.curPos, this.deltaPos);
                this.node.setPosition(this.curPos);
            }
        }
        //判斷滑鼠長壓時間
        if(this.longJumpOnce == false && this.mouseHold != null){
            this.mouseHoldTime += _delta_time;
            //達長壓判定時間
            if(this.mouseHoldTime > HOLD_TIME){
                if(this.mouseHold == EMouseType.MT_LEFT){
                    this.jumpByStep(2);
                }
                else{
                    this.jumpByStep(-2);
                }
                this.mouseHoldTime = 0;
                this.longJumpOnce = true; //一次長壓只跳一次
            }
        }
    }

    onMouseDown(_event: EventMouse) 
    {
        let btn = _event.getButton();
        if(btn == EMouseType.MT_LEFT || (btn == EMouseType.MT_RIGHT && GameModel.getCurMoveIdx() >= 2)){
            this.mouseHold = btn; //長壓開始
        }
    }

    onMouseUp(_event: EventMouse) 
    {
        //長壓結束
        this.mouseHold = null;
        this.mouseHoldTime = 0;
        if(this.longJumpOnce == true){
            this.longJumpOnce = false;
            return;
        }
        //一般點擊判定
        if(_event.getButton() == EMouseType.MT_LEFT){
            this.jumpByStep(1);
        }
        else if(_event.getButton() == EMouseType.MT_RIGHT && GameModel.getCurMoveIdx() >= 1){
            this.jumpByStep(-1);
        }
    }

    //動畫結束事件emit('JumpEnd')的回傳, 確保在GameController處理後才重置動畫可播放狀態
    onJumpEndCallBack()
    {
        this.startJump = false;
        this.startFall = false;
    }

    //掉落動畫開始
    fall() 
    {
        this.startFall = true;
        this.curJumpTime = 0; //延長落地時間
        const state = this.bodyAnim.getState('fall');
        state.speed = state.duration / JUMP_TIME; //設定動畫長度
        this.bodyAnim?.play('fall');
    }

    //跳起動畫開始
    jumpByStep(_step: number) 
    {
        if(this.startJump == true || this.startFall == true){
            return;
        }
        this.startJump = true;
        let jumpStep: number = _step * BLOCK_SIZE; //跳躍距離
        this.curJumpTime = 0;
        const state = this.bodyAnim.getState('oneStep');
        state.speed = state.duration / JUMP_TIME; //設定動畫長度
        this.curJumpSpeed = jumpStep / JUMP_TIME; //平移速度
        this.node.getPosition(this.curPos);
        Vec3.add(this.targetPos, this.curPos, new Vec3(jumpStep, 0, 0)); //設定目標位置
        this.bodyAnim?.play('oneStep');
        GameModel.setCurMoveIdx(GameModel.getCurMoveIdx() + _step);
    }

    //開關遊戲控制事件
    setInputActive(_act: boolean)
    {
        if(_act){
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }
        else{
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }
    }

    reset()
    {
        this.startJump = false;
        this.startFall = false;
        GameModel.setCurMoveIdx(0);
        this.node.setPosition(Vec3.ZERO);
        this.node.getPosition(this.curPos);
        this.body.node.setPosition(PLAYER_INIT_POS);
        this.mouseHoldTime = 0;
    }

    private startJump: boolean = false; //開始跳起動畫狀態
    private startFall: boolean = false; //開始落下動畫狀態
    private curJumpTime: number = 0; //紀錄跳起or落下動畫進行時間
    private curJumpSpeed: number = 0; //計算平移速度
    private curPos: Vec3 = new Vec3(); //紀錄當前位置
    private deltaPos: Vec3 = new Vec3(0, 0, 0); //每次update的位移量
    private targetPos: Vec3 = new Vec3(); //動畫開始時設定的目標位置
    private longJumpOnce: boolean = false; //一次長壓已跳一次判斷
    private mouseHold: EMouseType|null = null; //長壓狀態
    private mouseHoldTime: number = 0; //長壓時間
}


