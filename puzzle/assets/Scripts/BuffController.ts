import { _decorator, Component, Node, Label, CCInteger, SpriteAtlas, Sprite } from 'cc';
import { MIN_BOARD_LENGTH, MAX_BOARD_LENGTH, ADD_NEAR_RATE, GameModel } from './GameModel'
const { ccclass, property } = _decorator;

const MAX_SIZE_BUFF = 3;
const MIN_SIZE_BUFF = -3;
const MAX_OBSTACLE_BUFF = 4;
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
    BT_LOSE_1X1_PUZZLE,
    BT_CANNOT_ROTATE,
    BT_LESS_BUFF,
    BT_MORE_BUFF,
    BT_REFRESH,
    BT_GRAVITY,
    BT_BUOYANCY,
    BT_PASS,
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
    @property({type:Sprite})
    public buffSprite1:Sprite|null = null;
    @property({type:Sprite})
    public buffSprite2:Sprite|null = null;
    @property({type:Sprite})
    public buffSprite3:Sprite|null = null;
    @property({type:CCInteger})
    public buffSpace:number = 0;
    @property({type:SpriteAtlas})
    public buffAtlas:SpriteAtlas|null = null!;

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
        if(this.buffSprite1){
            this.buffSprites.push(this.buffSprite1);
        }
        if(this.buffSprite2){
            this.buffSprites.push(this.buffSprite2);
        }
        if(this.buffSprite3){
            this.buffSprites.push(this.buffSprite3);
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
                let atlas_id = this.buffList[i] + 1;
                if(this.buffList[i] == EBuffType.BT_LESS_BUFF){
                    if(this.buffNum - 1 == 1){
                        atlas_id = 12;
                    }
                    else if(this.buffNum - 1 == 2){
                        atlas_id = 18;
                    }
                }
                if(this.buffList[i] == EBuffType.BT_MORE_BUFF){
                    if(this.buffNum + 1 == 2){
                        atlas_id = 18;
                    }
                    else if(this.buffNum + 1 == 3){
                        atlas_id = 13;
                    }
                }
                this.buffSprites[i].spriteFrame = this.buffAtlas.getSpriteFrame("" + atlas_id);
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

    onBuffClick(_e:Event, _id:number)
    {
        this.setBuff(_id);
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
        for(let i = 3; i < add_near_rate.length; i++){
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

    setBuff(_id:number)
    {
        let type:EBuffType = this.buffList[_id];
        switch(type){
            case EBuffType.BT_GROW_STOP:
                break;
            case EBuffType.BT_GROW_DEC:
                if(GameModel.getBoardLength() > MIN_BOARD_LENGTH){
                    GameModel.setBoardLength(GameModel.getBoardLength() - 1);
                }
                break;
            case EBuffType.BT_SMALLER_PUZZLE:
                GameModel.setPuzzleSizeBuff(GameModel.getPuzzleSizeBuff() - 1);
                break;
            case EBuffType.BT_BIGGER_PUZZLE:
                GameModel.setPuzzleSizeBuff(GameModel.getPuzzleSizeBuff() + 1);
                break;
            case EBuffType.BT_LESS_HUE:
                GameModel.setLessHueBuff(GameModel.getLessHueBuff() + 1);
                break;
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
            case EBuffType.BT_LOSE_1X1_PUZZLE:
                GameModel.setOnecellBuff(GameModel.getOnecellBuff() - 1);
                this.buffList[_id] = EBuffType.BT_GROW_DEC;
                this.showBuffBtn();
                return;
            case EBuffType.BT_CANNOT_ROTATE:
                GameModel.setCannotRotateBuff(true);
                this.buffList[_id] = EBuffType.BT_GROW_DEC;
                this.showBuffBtn();
                return;
            case EBuffType.BT_LESS_BUFF:
                this.buffNum -= 1;
                this.refreshNum += 1;
                this.buffList.splice(_id, 1);
                this.showBuffBtn();
                return;
            case EBuffType.BT_MORE_BUFF:
                this.buffNum += 1;
                [this.buffList[_id], this.buffList[this.buffList.length - 1]] = [this.buffList[this.buffList.length - 1], this.buffList[_id]]
                this.showBuffBtn();
                return;
            case EBuffType.BT_REFRESH:
                this.generateBuffList();
                this.showBuffBtn();
                return;
            case EBuffType.BT_GRAVITY:
                GameModel.setGravityBuff(1);
                break;
            case EBuffType.BT_BUOYANCY:
                GameModel.setGravityBuff(-1);
                break;
            case EBuffType.BT_PASS:
                break;
        }
        if(type > EBuffType.BT_GROW_DEC && GameModel.getBoardLength() < MAX_BOARD_LENGTH){
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
        if(GameModel.getObstacleBuff() < MAX_OBSTACLE_BUFF){
            this.buffList.push(EBuffType.BT_ADD_OBSTACLE);
        }
        if(GameModel.getObstacleBuff() > 0){
            this.buffList.push(EBuffType.BT_DEC_OBSTACLE);
        }
        if(GameModel.getOnecellBuff() < MAX_ONECELL_BUFF){
            this.buffList.push(EBuffType.BT_GET_1X1_PUZZLE);
        }
        if(GameModel.getBoardLength() > MIN_BOARD_LENGTH){
            if(GameModel.getOnecellBuff() > 0){
                this.buffList.push(EBuffType.BT_LOSE_1X1_PUZZLE);
            }
            if(!GameModel.getCannotRotateBuff()){
                this.buffList.push(EBuffType.BT_CANNOT_ROTATE);
            }
        }
        if(this.buffNum > 1){
            this.buffList.push(EBuffType.BT_LESS_BUFF);
        }
        if(this.buffNum < MAX_BUFF_NUM){
            this.buffList.push(EBuffType.BT_MORE_BUFF);
        }
        this.buffList.push(EBuffType.BT_REFRESH);
        if(GameModel.getGravityBuff() == 0){
            this.buffList.push(EBuffType.BT_GRAVITY);
            this.buffList.push(EBuffType.BT_BUOYANCY);
        }
        this.buffList.push(EBuffType.BT_PASS);
        for(let i = 0; i < this.buffList.length; i++){
            let rand = Math.floor(Math.random() * (this.buffList.length - i)) + i;
            [this.buffList[i], this.buffList[rand]] = [this.buffList[rand], this.buffList[i]];
        }
    }

    private buffBtns:Node[] = [];
    private buffLabels:Label[] = [];
    private buffSprites:Sprite[] = [];
    private buffList:EBuffType[] = [];
    private buffNum:number = 2;
    private refreshNum:number = 90;
    private buffText:string[] = [
        '底板不擴大(1場)',
        '底板縮小',
        '小方塊變多',
        '大方塊變多',
        '方塊色差小',
        '方塊色差大',
        '底板缺格增加',
        '底板缺格減少',
        '獲得1x1方塊',
        '失去1x1方塊\n出現底板縮小',
        '不可旋轉(1場)\n出現底板縮小',
        '選項減少\n獲得刷新次數',
        '選項增加',
        '刷新選項',
        '產生重力(1場)',
        '產生浮力(1場)',
        '跳過'];
}


