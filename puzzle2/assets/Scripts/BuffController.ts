import { _decorator, Component, Node, Label, CCInteger, Game } from 'cc';
import { MIN_BOARD_LENGTH, MAX_BOARD_LENGTH, ADD_NEAR_RATE, GameModel } from './GameModel'
const { ccclass, property } = _decorator;

const MAX_SIZE_BUFF = 3;
const MIN_SIZE_BUFF = -3;
const MAX_ABSTACLE_BUFF = 4;
const MAX_ONECELL_BUFF = 5;
const MAX_BUFF_NUM = 3;

enum EBuffType{
    BT_GROW_STOP,
    BT_GROW_DEC,
    BT_SMALLER_PUZZLE,
    BT_BIGGER_PUZZLE,
    BT_LESS_HUE,
    BT_MORE_HUE,
    BT_ADD_OBSTACLE,
    BT_DEC_OBSTACLE,
    BT_GET_1X1_PUZZLE,
    BT_CANNOT_ROTATE,
    BT_LESS_BUFF,
    BT_MORE_BUFF,
    BT_MORE_REFRESH,
    BT_GRAVITY,
}

@ccclass('BuffController')
export class BuffController extends Component {

    @property({type:Node})
    public refreshBtn:Node|null = null;
    @property({type:Label})
    public freshLabel:Label|null = null;
    @property({type:Node})
    public buffBtn1:Node|null = null;
    @property({type:Node})
    public buffBtn2:Node|null = null;
    @property({type:Node})
    public buffBtn3:Node|null = null;
    @property({type:Label})
    public buffLabel1:Label|null = null;
    @property({type:Label})
    public buffLabel2:Label|null = null;
    @property({type:Label})
    public buffLabel3:Label|null = null;
    @property({type:CCInteger})
    public buffSpace:number = 0;

    start()
    {
        if(this.buffBtn1){
            this.buffBtns.push(this.buffBtn1);
        }
        if(this.buffBtn2){
            this.buffBtns.push(this.buffBtn2);
        }
        if(this.buffBtn3){
            this.buffBtns.push(this.buffBtn3);
        }
        if(this.buffLabel1){
            this.buffLabels.push(this.buffLabel1);
        }
        if(this.buffLabel2){
            this.buffLabels.push(this.buffLabel2);
        }
        if(this.buffLabel3){
            this.buffLabels.push(this.buffLabel3);
        }
    }

    update(deltaTime: number) {}

    showBuffBtn()
    {
        for(let i = 0; i < this.buffBtns.length; i++){
            if(this.buffNum > i){
                this.buffBtns[i].active = true;
                this.buffBtns[i].setPosition(this.buffSpace * (this.buffNum - 1) * (-0.5) + i * this.buffSpace, 0, 0);
                this.buffLabels[i].string = this.buffText[this.buffList[i]];
            }
            else{
                this.buffBtns[i].active = false;
            }
        }
        if(this.refreshBtn){
            this.refreshBtn.active = this.refreshNum > 0;
            if(this.freshLabel){
                this.freshLabel.string = '' + this.refreshNum;
            }
        }
    }

    onBuff1Click()
    {
        this.setBuff(this.buffList[0]);
    }

    onBuff2Click()
    {
        this.setBuff(this.buffList[1]);
    }

    onBuff3Click()
    {
        this.setBuff(this.buffList[2]);
    }

    onRefreshClick()
    {
        this.refreshNum -= 1;
        this.generateBuffList();
        this.showBuffBtn();
    }

    getBuffAddNearRate():number[]
    {
        let add_near_rate = ADD_NEAR_RATE.slice();
        for(let i = 2; i < add_near_rate.length; i++){
            add_near_rate[i] += GameModel.getPuzzleSizeBuff() * 0.1;
            if(add_near_rate[i] > 1.0){
                add_near_rate[i] = 1.0;
            }
            else if(add_near_rate[i] < 0){
                add_near_rate[i] = 0;
            }
        }
        return add_near_rate;
    }

    setBuff(_type:EBuffType)
    {
        switch(_type){
            case EBuffType.BT_GROW_STOP:
                break;
            case EBuffType.BT_GROW_DEC:
                GameModel.setBoardLength(GameModel.getBoardLength() - 1);
                break;
            case EBuffType.BT_SMALLER_PUZZLE:
                GameModel.setPuzzleSizeBuff(GameModel.getPuzzleSizeBuff() - 1);
                break;
            case EBuffType.BT_BIGGER_PUZZLE:
                GameModel.setPuzzleSizeBuff(GameModel.getPuzzleSizeBuff() + 1);
                break;
            case EBuffType.BT_LESS_HUE:
                GameModel.setLessHueBuff(GameModel.getLessHueBuff() + 1);
                this.generateBuffList();
                this.showBuffBtn();
                return;
            case EBuffType.BT_MORE_HUE:
                GameModel.setLessHueBuff(GameModel.getLessHueBuff() - 1);
                break;
            case EBuffType.BT_ADD_OBSTACLE:
                GameModel.setObstacleBuff(GameModel.getObstacleBuff() + 1);
                break;
            case EBuffType.BT_DEC_OBSTACLE:
                GameModel.setObstacleBuff(GameModel.getObstacleBuff() - 1);
                break;
            case EBuffType.BT_GET_1X1_PUZZLE:
                GameModel.setOnecellBuff(GameModel.getOnecellBuff() + 1);
                break;
            case EBuffType.BT_CANNOT_ROTATE:
                GameModel.setCannotRotateBuff(true);
                this.generateBuffList();
                this.buffList[0] = EBuffType.BT_GROW_DEC;
                this.showBuffBtn();
                return;
            case EBuffType.BT_LESS_BUFF:
                this.buffNum -= 1;
                this.generateBuffList();
                this.buffList[0] = EBuffType.BT_GROW_DEC;
                this.showBuffBtn();
                return;
            case EBuffType.BT_MORE_BUFF:
                this.buffNum += 1;
                this.generateBuffList();
                this.showBuffBtn();
                return;
            case EBuffType.BT_MORE_REFRESH:
                this.refreshNum += 1;
                break;
            case EBuffType.BT_GRAVITY:
                GameModel.setGravityBuff(true);
                this.generateBuffList();
                this.showBuffBtn();
                return;
        }
        if(_type > EBuffType.BT_GROW_DEC){
            GameModel.setBoardLength(GameModel.getBoardLength() + 1);
        }
        this.node.emit('onSetBuffFinish');
    }

    generateBuffList()
    {
        this.buffList = [];
        if(GameModel.getBoardLength() < MAX_BOARD_LENGTH){
            this.buffList.push(EBuffType.BT_GROW_STOP);
        }
        if(GameModel.getPuzzleSizeBuff() > MIN_SIZE_BUFF){
            this.buffList.push(EBuffType.BT_SMALLER_PUZZLE);
        }
        if(GameModel.getPuzzleSizeBuff() < MAX_SIZE_BUFF){
            this.buffList.push(EBuffType.BT_BIGGER_PUZZLE);
        }
        this.buffList.push(EBuffType.BT_LESS_HUE);
        if(GameModel.getLessHueBuff() > 1){
            this.buffList.push(EBuffType.BT_MORE_HUE);
        }
        if(GameModel.getObstacleBuff() < MAX_ABSTACLE_BUFF){
            this.buffList.push(EBuffType.BT_ADD_OBSTACLE);
        }
        if(GameModel.getObstacleBuff() > 0){
            this.buffList.push(EBuffType.BT_DEC_OBSTACLE);
        }
        if(GameModel.getOnecellBuff() < MAX_ONECELL_BUFF){
            this.buffList.push(EBuffType.BT_GET_1X1_PUZZLE);
        }
        if(GameModel.getBoardLength() > MIN_BOARD_LENGTH){
            if(!GameModel.getCannotRotateBuff()){
                this.buffList.push(EBuffType.BT_CANNOT_ROTATE);
            }
            if(this.buffNum > 1){
                this.buffList.push(EBuffType.BT_LESS_BUFF);
            }
        }
        if(this.buffNum < MAX_BUFF_NUM){
            this.buffList.push(EBuffType.BT_MORE_BUFF);
        }
        this.buffList.push(EBuffType.BT_MORE_REFRESH);
        if(!GameModel.getGravityBuff()){
            this.buffList.push(EBuffType.BT_GRAVITY);
        }
        for(let i = 0; i < this.buffList.length; i++){
            let rand = Math.floor(Math.random() * (this.buffList.length - i)) + i;
            [this.buffList[i], this.buffList[rand]] = [this.buffList[rand], this.buffList[i]];
        }
    }

    private buffBtns:Node[] = [];
    private buffLabels:Label[] = [];
    private buffList:EBuffType[] = [];
    private buffNum:number = 2;
    private refreshNum:number = 0;
    private buffText:string[] = [
        '下關底板停止成長',
        '底板縮小',
        '方塊容易變小',
        '方塊容易變大',
        '方塊色差減少\n刷新效果',
        '方塊色差增加',
        '底板缺格增加',
        '底板缺格減少',
        '獲得1x1方塊',
        '下關不可旋轉方塊\n出現底板縮小效果',
        '減少選擇數量\n出現底板縮小效果',
        '增加選擇數量',
        '獲得額外刷新次數',
        '下關產生重力\n刷新效果'];
}


