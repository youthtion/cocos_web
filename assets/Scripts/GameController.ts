import { _decorator, CCInteger, Component, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { PlayerController } from './PlayerController'
import { GameStateType, BlockType, BLOCK_SIZE, GameModel } from './GameModel'
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    //綁定編輯器選擇元件
    @property({type:Prefab})
    public boxPrefab:Prefab|null = null;
    @property({type:CCInteger})
    public roadLength:number = 0;
    @property({type:Node})
    public startMenu:Node|null = null;
    @property({type:PlayerController})
    public playerCtrl:PlayerController|null = null;
    @property({type:Label})
    public stepsLabel:Label|null = null;
    @property({type:Label})
    public btnLabel:Label|null = null;
    @property({type:Label})
    public titleLabel:Label|null = null;

    start()
    {
        this.changeCurState(GameStateType.GS_INIT); //遊戲初期狀態
        this.playerCtrl?.node.on('JumpEnd', this.onJunpEnd, this); //接收跳躍動畫結束事件emit('JumpEnd')
    }

    update(_delta_time: number){}

    //設定隨機平台
    generateRoad()
    {
        this.node.removeAllChildren(); //清空原有地面
        let road:BlockType[] = [];
        road.push(BlockType.BT_STONE); //第一格固定為地面
        let last = BlockType.BT_STONE;
        for(let i = 1; i < this.roadLength; i++){
            let rand:number = Math.floor(Math.random() * 2);
            //避免連續兩個非地面
            if(last == BlockType.BT_NONE){
                road.push(BlockType.BT_STONE);
            }
            else{
                road.push(rand);
            }
            last = rand;
        }
        road.push(BlockType.BT_STONE); //最後格固定為地面
        //依照road設定新增prefab
        for(let i = 0; i < road.length; i++){
            let block:Node|null = this.spawnBlockByType(road[i]);
            if(block){
                this.node.addChild(block);
                block.setPosition(i * BLOCK_SIZE, 0, 0)
            }
        }
        //更新到GameModel
        GameModel.setRoad(road);
    }

    //新增prefab並回傳, 不新增時回傳null
    spawnBlockByType(_type: BlockType)
    {
        if(!this.boxPrefab){
            return null;
        }
        let block:Node|null = null;
        if(_type == BlockType.BT_STONE){
            block = instantiate(this.boxPrefab);
        }
        return block;
    }

    //設定開始&結束介面是否顯示
    setMenuVisible(_show: boolean)
    {
        if(this.startMenu){
            this.startMenu.active = _show;
            //介面顯示時遊戲需停止, 開關遊戲控制事件
            if(_show == true){
                this.playerCtrl?.setInputActive(false);
            }
            else{
                setTimeout(()=>{
                    this.playerCtrl?.setInputActive(true);
                }, 0.1);
            }
        }
    }

    //變更遊戲狀態
    changeCurState(_value: GameStateType)
    {
        switch(_value){
            //遊戲初期狀態
            case GameStateType.GS_INIT:
                this.setMenuVisible(true);
                if(this.stepsLabel){
                    this.stepsLabel.string = '';
                }
                break;
            //遊戲進行狀態
            case GameStateType.GS_GAME:
                this.setMenuVisible(false);
                if(this.stepsLabel){
                    this.stepsLabel.string = 'Score : 0';
                }
                this.generateRoad(); //重新產生地面
                this.playerCtrl?.reset(); //重置玩家狀態
                break;
            //遊戲結束狀態
            case GameStateType.GS_OVER:
                this.setMenuVisible(true);
                if(this.btnLabel){
                    this.btnLabel.string = 'Restart';
                }
                if(this.titleLabel){
                    this.titleLabel.string = '';
                }
                break;
        }
    }

    //開始&重新開始按鈕事件
    onStartButtonClicked()
    {
        this.changeCurState(GameStateType.GS_GAME); //遊戲進行狀態
    }

    //接收跳躍動畫結束事件
    onJunpEnd()
    {
        //檢查到達終點
        let road:BlockType[] = GameModel.getRoad();
        if(GameModel.getCurMoveIdx() >= this.roadLength){
            GameModel.setCurMoveIdx(this.roadLength);
            this.changeCurState(GameStateType.GS_OVER); //遊戲結束狀態
        }
        //檢查失敗
        if(road[GameModel.getCurMoveIdx()] == BlockType.BT_NONE){
            this.changeCurState(GameStateType.GS_OVER); //遊戲結束狀態
        }
        //未失敗更新計數文字
        else if(this.stepsLabel){                    
            this.stepsLabel.string = 'Score : ' + GameModel.getCurMoveIdx();
            this.playerCtrl?.onJumpEndCallBack(); //處理完畢回傳PlayerController
        }
    }
}


