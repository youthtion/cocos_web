import { _decorator, Component } from 'cc';
import { MAX_BOARD_LENGTH, MIN_BOARD_LENGTH, EGameEvents, EGameState, EBuffType, GameModel } from './GameModel'
const { ccclass } = _decorator;

@ccclass('PreloadController')
export class PreloadController extends Component {

    start()
    {
        if (typeof window !== 'undefined') {
            let p = new URLSearchParams(window.location.search); //尋找網址後query string
            this.loadQueryString(p);
        }
    }

    update(deltaTime: number) {}

    //支援模式處理
    loadQueryString(_p:URLSearchParams)
    {
        if(_p.has('b') && _p.has('h') && _p.has('r') && _p.has('g') && _p.has('o') && _p.has('p')){
            //檢查有無參數及各參數是否合理
            let board_len = parseInt(_p.get('b'));
            if(isNaN(board_len) || board_len < MIN_BOARD_LENGTH || board_len > MAX_BOARD_LENGTH){
                return;
            }
            let hue = parseInt(_p.get('h'));
            if(isNaN(hue) || hue < 0){
                return;
            }
            let rotate = parseInt(_p.get('r'));
            if(isNaN(rotate) || rotate < 0 || rotate > 1){
                return;
            }
            let gravity = parseInt(_p.get('g'));
            if(isNaN(gravity) || gravity < -1 || gravity > 1){
                return;
            }
            let obstacles_str = _p.get('o');
            if(!/^\d+$/.test(obstacles_str) || (obstacles_str.length % 2 != 0 && obstacles_str != '0')){
                return;
            }
            let puzzles_strs = _p.getAll('p');
            for(let i = 0; i < puzzles_strs.length; i++){
                let puzzles_str = puzzles_strs[i];
                if(!/^\d+$/.test(puzzles_str) || puzzles_str.length % 2 != 0){
                    return;
                }
            }
            //參數加入設定
            GameModel.setBoardLength(board_len);
            GameModel.setBuff(EBuffType.BD_HUE, hue);
            GameModel.setBuff(EBuffType.BD_ROTATE, rotate);
            GameModel.setBuff(EBuffType.BD_GRAVITY, gravity);
            //參數指定缺格位置
            let obstacle_set:Set<number> = new Set<number>()
            if(obstacles_str != '0'){
                for(let i = 0; i < obstacles_str.length; i += 2){
                    let [x, y] = [parseInt(obstacles_str[i]), parseInt(obstacles_str[i + 1])]; //xy一組
                    obstacle_set.add(x * board_len + y);
                }
            }
            //參數指定拼圖形狀
            let puzzles:number[][][] = [];
            for(let i = 0; i < puzzles_strs.length; i++){
                let puzzles_str = puzzles_strs[i];
                let puzzle:number[][] = [];
                for(let j = 0; j < puzzles_str.length; j += 2){
                    let [x, y] = [parseInt(puzzles_str[j]), parseInt(puzzles_str[j + 1])]; //xy一組
                    puzzle.push([x, y]);
                }
                puzzles.push(puzzle);
            }
            GameModel.setPuzzles(puzzles);
            this.node.emit(EGameEvents.GE_PRELOADED, obstacle_set);
        }
    }

    setQueryString()
    {
        //生成網址後query string
        let board = GameModel.getBoard().map(v => v.slice());
        let query_str = 'b=' + board.length.toString(); //底板大小
        query_str += '&h=' + GameModel.getBuff(EBuffType.BD_HUE).toString();     //色差buff
        query_str += '&r=' + GameModel.getBuff(EBuffType.BD_ROTATE).toString();  //旋轉buff
        query_str += '&g=' + GameModel.getBuff(EBuffType.BD_GRAVITY).toString(); //重力buff
        //缺格位置
        let o = '';
        for(let i = 0; i < board.length; i++){
            for(let j = 0; j < board[i].length; j++){
                if(board[i][j] == Infinity){
                    o += i.toString() + j.toString(); //xy一組
                }
            }
        }
        //無缺格, 參數0
        if(o == ''){
            query_str += '&o=0';
        }
        else{
            query_str += '&o=' + o;
        }
        //拼圖形狀
        let puzzles = GameModel.getPuzzles().map(v0 => v0.map(v1 => v1.slice()));
        for(let i = 0; i < puzzles.length; i++){
            query_str += '&p=';
            for(let j = 0; j < puzzles[i].length; j++){
                let [x, y] = puzzles[i][j];
                query_str += x.toString() + y.toString(); //xy一組
            }
        }
        GameModel.setQueryString(query_str);
    }
}


