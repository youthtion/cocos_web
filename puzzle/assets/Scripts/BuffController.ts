import { _decorator, Component, Node, Label, CCInteger, SpriteAtlas, Sprite } from 'cc';
import { MIN_BOARD_LENGTH, MAX_BOARD_LENGTH, ADD_NEAR_RATE, EGameEvents, EBuffType, GameModel } from './GameModel'
const { ccclass, property } = _decorator;

const MAX_SIZE_BUFF = 3;     //小方塊增加buff層數限制
const MIN_SIZE_BUFF = -3;    //大方塊增加buff層數限制
const MAX_OBSTACLE_BUFF = 4; //底板缺格buff層數限制
const MAX_ONECELL_BUFF = 5;  //1x1方塊buff層數限制
const MAX_BUFF_NUM = 3;      //最大選項數量

//介面buff類型, id對照buff圖集的編號
enum EBuffUIType{
    BU_GROW_STOP,
    BU_GROW_DEC,
    BU_SMALLER_PUZZLE,
    BU_BIGGER_PUZZLE,
    BU_LESS_HUE,
    BU_MORE_HUE,
    BU_ADD_OBSTACLE,
    BU_DEC_OBSTACLE,
    BU_GET_1X1_PUZZLE,
    BU_LOSE_1X1_PUZZLE,
    BU_CANNOT_ROTATE,
    BU_LESS_BUFF, BU_BUFF_START = BU_LESS_BUFF,
    BU_ONE_BUFF,
    BU_TWO_BUFF,
    BU_THREE_BUFF,
    BU_MORE_BUFF,
    BU_REFRESH,
    BU_GRAVITY,
    BU_BUOYANCY,
    BU_PASS,
}

//介面buff顯示文字, 對照EBuffUIType
const BUFF_TEXT: Record<EBuffUIType, string> = {
    [EBuffUIType.BU_GROW_STOP]:'底板不擴大(1場)',
    [EBuffUIType.BU_GROW_DEC]:'底板縮小',
    [EBuffUIType.BU_SMALLER_PUZZLE]:'小方塊變多',
    [EBuffUIType.BU_BIGGER_PUZZLE]:'大方塊變多',
    [EBuffUIType.BU_LESS_HUE]:'方塊色差小',
    [EBuffUIType.BU_MORE_HUE]:'方塊色差大',
    [EBuffUIType.BU_ADD_OBSTACLE]:'底板缺格增加',
    [EBuffUIType.BU_DEC_OBSTACLE]:'底板缺格減少',
    [EBuffUIType.BU_GET_1X1_PUZZLE]:'獲得1x1方塊',
    [EBuffUIType.BU_LOSE_1X1_PUZZLE]:'失去1x1方塊\n出現底板縮小',
    [EBuffUIType.BU_CANNOT_ROTATE]:'不可旋轉(1場)\n出現底板縮小',
    [EBuffUIType.BU_LESS_BUFF]:'選項減少\n獲得刷新次數',
    [EBuffUIType.BU_ONE_BUFF]:'',   //圖集id使用, 無顯示文字
    [EBuffUIType.BU_TWO_BUFF]:'',   //同上
    [EBuffUIType.BU_THREE_BUFF]:'', //同上
    [EBuffUIType.BU_MORE_BUFF]:'選項增加',
    [EBuffUIType.BU_REFRESH]:'刷新選項',
    [EBuffUIType.BU_GRAVITY]:'產生重力(1場)',
    [EBuffUIType.BU_BUOYANCY]:'產生浮力(1場)',
    [EBuffUIType.BU_PASS]:'跳過',
};

@ccclass('BuffController')
export class BuffController extends Component {

    @property({type:Node})
    private refreshBtn:Node|null = null;
    @property({type:Label})
    private freshLabel:Label|null = null;
    @property({type:Node})
    private buffBtn1:Node|null = null;
    @property({type:Node})
    private buffBtn2:Node|null = null;
    @property({type:Node})
    private buffBtn3:Node|null = null;
    @property({type:Label})
    private buffLabel1:Label|null = null;
    @property({type:Label})
    private buffLabel2:Label|null = null;
    @property({type:Label})
    private buffLabel3:Label|null = null;
    @property({type:Sprite})
    private buffSprite1:Sprite|null = null;
    @property({type:Sprite})
    private buffSprite2:Sprite|null = null;
    @property({type:Sprite})
    private buffSprite3:Sprite|null = null;
    @property({type:CCInteger})
    private buffSpace:number = 0;
    @property({type:SpriteAtlas})
    private buffAtlas:SpriteAtlas|null = null!;

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
            //根據選項buff量顯示buff按鈕
            if(this.buffNum > i){
                this.buffBtns[i].active = true;
                this.buffBtns[i].setPosition(this.buffSpace * (this.buffNum - 1) * (-0.5) + i * this.buffSpace, 0, 0); //位置平均分散設定
                this.buffLabels[i].string = BUFF_TEXT[this.buffList[i]];
                let atlas_id = this.buffList[i];
                //變更選項數量的圖示根據選項數量顯示
                if(this.buffList[i] == EBuffUIType.BU_LESS_BUFF){
                    atlas_id = EBuffUIType.BU_BUFF_START + (this.buffNum - 1);
                }
                else if(this.buffList[i] == EBuffUIType.BU_MORE_BUFF){
                    atlas_id = EBuffUIType.BU_BUFF_START + (this.buffNum + 1);
                }
                this.buffSprites[i].spriteFrame = this.buffAtlas.getSpriteFrame("" + atlas_id);
            }
            else{
                this.buffBtns[i].active = false;
            }
        }
        //根據持有刷新buff數顯示刷新buff按鈕與次數
        if(this.refreshBtn){
            this.refreshBtn.active = this.refreshNum > 0;
            if(this.freshLabel){
                this.freshLabel.string = '' + this.refreshNum;
            }
        }
    }

    //選擇第N個buff按鈕
    onBuffClick(_e:Event, _id:number)
    {
        this.setBuff(_id);
    }

    //刷新buff
    onRefreshClick()
    {
        this.refreshNum -= 1;
        this.generateBuffList();
        this.showBuffBtn();
    }

    //拼圖生成時長為N塊的機率(大小方塊buff調整)
    getBuffAddNearRate():number[]
    {
        let add_near_rate = ADD_NEAR_RATE.slice();
        //大小方塊buff依層數調整面積4以上方塊的生成機率
        for(let i = 3; i < add_near_rate.length; i++){
            add_near_rate[i] += GameModel.getBuff(EBuffType.BD_SIZE) * 0.1;
            if(add_near_rate[i] > 1.0){
                add_near_rate[i] = 1.0;
            }
            else if(add_near_rate[i] < 0){
                add_near_rate[i] = 0;
            }
        }
        return add_near_rate;
    }

    //選擇指定buff
    setBuff(_id:number)
    {
        let type:EBuffUIType = this.buffList[_id];
        switch(type){
            case EBuffUIType.BU_GROW_DEC:
                if(GameModel.getBoardLength() > MIN_BOARD_LENGTH){
                    GameModel.decreaseBoardLength();
                }
                break;
            case EBuffUIType.BU_SMALLER_PUZZLE:
                GameModel.decreaseBuff(EBuffType.BD_SIZE);
                break;
            case EBuffUIType.BU_BIGGER_PUZZLE:
                GameModel.addBuff(EBuffType.BD_SIZE);
                break;
            case EBuffUIType.BU_LESS_HUE:
                GameModel.addBuff(EBuffType.BD_HUE);
                break;
            case EBuffUIType.BU_MORE_HUE:
                GameModel.decreaseBuff(EBuffType.BD_HUE);
                break;
            case EBuffUIType.BU_ADD_OBSTACLE:
                GameModel.addBuff(EBuffType.BD_OBSTACLE);
                break;
            case EBuffUIType.BU_DEC_OBSTACLE:
                GameModel.decreaseBuff(EBuffType.BD_OBSTACLE);
                break;
            case EBuffUIType.BU_GET_1X1_PUZZLE:
                GameModel.addBuff(EBuffType.BD_ONECELL);
                break;
            case EBuffUIType.BU_LOSE_1X1_PUZZLE:
                GameModel.decreaseBuff(EBuffType.BD_ONECELL);
                this.buffList[_id] = EBuffUIType.BU_GROW_DEC;
                this.showBuffBtn();
                return;
            case EBuffUIType.BU_CANNOT_ROTATE:
                GameModel.setBuff(EBuffType.BD_ROTATE, 1);
                this.buffList[_id] = EBuffUIType.BU_GROW_DEC;
                this.showBuffBtn();
                return;
            case EBuffUIType.BU_LESS_BUFF:
                this.buffNum -= 1;
                this.refreshNum += 1;
                this.buffList.splice(_id, 1);
                this.showBuffBtn();
                return;
            case EBuffUIType.BU_MORE_BUFF:
                this.buffNum += 1;
                [this.buffList[_id], this.buffList[this.buffList.length - 1]] = [this.buffList[this.buffList.length - 1], this.buffList[_id]]
                this.showBuffBtn();
                return;
            case EBuffUIType.BU_REFRESH:
                this.generateBuffList();
                this.showBuffBtn();
                return;
            case EBuffUIType.BU_GRAVITY:
                GameModel.setBuff(EBuffType.BD_GRAVITY, 1);
                break;
            case EBuffUIType.BU_BUOYANCY:
                GameModel.setBuff(EBuffType.BD_GRAVITY, -1);
                break;
        }
        //底板成長buff在非選擇底板相關buff後固定成長1
        if(type > EBuffUIType.BU_GROW_DEC && GameModel.getBoardLength() < MAX_BOARD_LENGTH){
            GameModel.addBoardLength();
        }
        //處理完觸發下場遊戲邏輯
        this.node.emit(EGameEvents.GE_ADD_BUFF);
    }

    generateBuffList()
    {
        //判定可加入隨機列表的buff
        this.buffList = [];
        if(GameModel.getBoardLength() < MAX_BOARD_LENGTH){
            this.buffList.push(EBuffUIType.BU_GROW_STOP);
        }
        if(GameModel.getBuff(EBuffType.BD_SIZE) > MIN_SIZE_BUFF){
            this.buffList.push(EBuffUIType.BU_SMALLER_PUZZLE);
        }
        if(GameModel.getBuff(EBuffType.BD_SIZE) < MAX_SIZE_BUFF){
            this.buffList.push(EBuffUIType.BU_BIGGER_PUZZLE);
        }
        this.buffList.push(EBuffUIType.BU_LESS_HUE);
        if(GameModel.getBuff(EBuffType.BD_HUE) > 0){
            this.buffList.push(EBuffUIType.BU_MORE_HUE);
        }
        if(GameModel.getBuff(EBuffType.BD_OBSTACLE) < MAX_OBSTACLE_BUFF){
            this.buffList.push(EBuffUIType.BU_ADD_OBSTACLE);
        }
        if(GameModel.getBuff(EBuffType.BD_OBSTACLE) > 0){
            this.buffList.push(EBuffUIType.BU_DEC_OBSTACLE);
        }
        if(GameModel.getBuff(EBuffType.BD_ONECELL) < MAX_ONECELL_BUFF){
            this.buffList.push(EBuffUIType.BU_GET_1X1_PUZZLE);
        }
        if(GameModel.getBoardLength() > MIN_BOARD_LENGTH){
            if(GameModel.getBuff(EBuffType.BD_ONECELL) > 0){
                this.buffList.push(EBuffUIType.BU_LOSE_1X1_PUZZLE);
            }
            if(GameModel.getBuff(EBuffType.BD_ROTATE) == 0){
                this.buffList.push(EBuffUIType.BU_CANNOT_ROTATE);
            }
        }
        if(this.buffNum > 1){
            this.buffList.push(EBuffUIType.BU_LESS_BUFF);
        }
        if(this.buffNum < MAX_BUFF_NUM){
            this.buffList.push(EBuffUIType.BU_MORE_BUFF);
        }
        this.buffList.push(EBuffUIType.BU_REFRESH);
        if(GameModel.getBuff(EBuffType.BD_GRAVITY) == 0){
            this.buffList.push(EBuffUIType.BU_GRAVITY);
            this.buffList.push(EBuffUIType.BU_BUOYANCY);
        }
        this.buffList.push(EBuffUIType.BU_PASS);
        //加入完將列表隨機排序
        for(let i = 0; i < this.buffList.length; i++){
            let rand = Math.floor(Math.random() * (this.buffList.length - i)) + i;
            [this.buffList[i], this.buffList[rand]] = [this.buffList[rand], this.buffList[i]];
        }
    }

    private buffBtns:Node[] = [];
    private buffLabels:Label[] = [];
    private buffSprites:Sprite[] = [];
    private buffList:EBuffUIType[] = []; //符合加入至隨機列表的buff
    private buffNum:number = 2;    //buff選項數
    private refreshNum:number = 0; //buff刷新數
}