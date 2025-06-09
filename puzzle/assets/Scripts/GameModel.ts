import { Color } from 'cc';

export const CELL_WIDTH = 60; //棋盤格長寬
export const FIT_ALLOW = Math.floor(CELL_WIDTH / 4); //拼圖靠近吸附距離(1/4棋盤格)
export const BOARD_COLOR = new Color(64, 64, 64); //棋盤顏色
export const OBSTACLE_COLOR = new Color(0, 0, 0);
export const ADD_NEAR_RATE = [1.0, 1.0, 1.0, 0.7, 0.5, 0.3]; //拼圖生成時長為N塊的機率
export const MAX_BOARD_LENGTH = 10; //最大棋盤大小
export const MIN_BOARD_LENGTH = 3;  //最小棋盤大小

export enum EBuffType{
    BD_SIZE,
    BD_HUE,
    BD_ROTATE,
    BD_OBSTACLE,
    BD_ONECELL,
    BD_GRAVITY,
    BD_MAX,
}

export class CGameModel{
    private boardLength:number = MIN_BOARD_LENGTH; //棋盤大小
    private stage:number = 1;          //關卡
    private board:number[][] = [];     //棋盤資訊(初始為-1填滿, 使用格填入)
    private puzzles:number[][][] = []; //拼圖資訊([第N個拼圖][第N個CELL][該CELL的x,y])
    private buffData:number[] = new Array(EBuffType.BD_MAX).fill(0);
    private helpMode:boolean = false;

    public setBoardLength(_set:number) { this.boardLength = _set; }
    public setStage(_set:number) { this.stage = _set; }
    public setBoard(_set:number[][]) { this.board = _set.map(v => v.slice()); }
    public setPuzzles(_set:number[][][]) { this.puzzles = _set.map(v0 => v0.map(v1 => v1.slice())); }
    public addBuff(_type:EBuffType) { this.buffData[_type]++; }
    public decreaseBuff(_type:EBuffType) { this.buffData[_type]--; }
    public removeBuff(_type:EBuffType) { this.buffData[_type] = 0; }
    public setBuff(_type:EBuffType, _set:number) { this.buffData[_type] = _set; }
    public setHelpMode(_set:boolean) { this.helpMode = _set; }

    public getBoardLength():number { return this.boardLength; }
    public getStage():number { return this.stage; }
    public getBoard():number[][] { return this.board; }
    public getPuzzles():number[][][] { return this.puzzles; }
    public getBuff(_type:EBuffType):EBuffType { return this.buffData[_type]; }
    public getHelpMode():boolean { return this.helpMode; }
}

export const GameModel = new CGameModel();