import { Color } from 'cc';
export const CELL_WIDTH = 60;
export const FIT_ALLOW = 12;
export const BOARD_COLOR = new Color(64, 64, 64);
export const ADD_NEAR_RATE = [1.0, 1.0, 1.0, 0.7, 0.5, 0.2]

export class CGameModel{
    private boardLength:number = 3;
    private board:number[][] = [];
    private puzzles:number[][][] = [];

    public setBoardLength(_set:number)
    {
        this.boardLength = _set;
    }

    public getBoardLength():number
    {
        return this.boardLength;
    }

    public setBoard(_set:number[][])
    {
        this.board = _set.map(v => v.slice());
    }

    public getBoard():number[][]
    {
        return this.board;
    }

    public setPuzzles(_set:number[][][])
    {
        this.puzzles = _set.map(v0 => v0.map(v1 => v1.slice()));
    }

    public getPuzzles():number[][][]
    {
        return this.puzzles;
    }
}

export const GameModel = new CGameModel();