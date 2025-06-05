export const BLOCK_SIZE = 40; //一單位地面長度&玩家位移距離
export const JUMP_TIME = 0.3; //跳躍動畫播放時長
export const HOLD_TIME = 0.25; //滑鼠判定為長壓時長

//地面類型
export enum BlockType{
    BT_NONE,  //空
    BT_STONE, //地面
}
//遊戲狀態
export enum GameStateType{
    GS_INIT, //初始
    GS_GAME, //進行
    GS_OVER, //結束
}

export class CGameModel{
    private road:BlockType[] = []; //紀錄地面狀態
    private curMoveIdx:number = 0; //紀錄已前進值

    public getRoad():BlockType[]
    {
        return this.road;
    }

    public setRoad(_set:BlockType[])
    {
        this.road = _set.slice();
    }

    public setCurMoveIdx(_set:number)
    {
        this.curMoveIdx = _set;
    }

    public getCurMoveIdx():number
    {
        return this.curMoveIdx;
    }
}

export const GameModel = new CGameModel();