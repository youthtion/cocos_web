import { _decorator, Component } from 'cc';
import { MAX_BUFF_NUM, MAX_ONECELL_BUFF, MAX_OBSTACLE_BUFF, MAX_SIZE_BUFF, MIN_SIZE_BUFF, MAX_BOARD_LENGTH, MIN_BOARD_LENGTH, EGameEvents, EGameState, EBuffType, GameModel } from './GameModel'
const { ccclass } = _decorator;

@ccclass('PreloadController')
export class PreloadController extends Component {

    start()
    {
        if (typeof window !== 'undefined') {
            let p = new URLSearchParams(window.location.search); //尋找網址後query string
            if(!this.loadQueryString(p)){
                this.loadCookie(); //無query string生成關卡, 讀cookie
            }
        }
    }

    update(deltaTime: number) {}

    loadStage(_s:string, _bs:string, _bo:string, _bc:string, _br:string, _bn:string, _b:string, _h:string, _r:string, _g:string, _o:string, _p:string[], _gs:EGameState):boolean
    {
        //檢查有無參數及各參數是否合理
        let stage = parseInt(_s);
        if(isNaN(stage)){
            return false;
        }
        let buff_size = parseInt(_bs);
        if(isNaN(buff_size) || buff_size < MIN_SIZE_BUFF || buff_size > MAX_SIZE_BUFF){
            return false;
        }
        let buff_obstacle = parseInt(_bo);
        if(isNaN(buff_obstacle) || buff_obstacle > MAX_OBSTACLE_BUFF){
            return false;
        }
        let buff_onecell = parseInt(_bc);
        if(isNaN(buff_onecell) || buff_onecell > MAX_ONECELL_BUFF){
            return false;
        }
        let buff_refresh = parseInt(_br);
        if(isNaN(buff_refresh) || buff_refresh < 0){
            return false;
        }
        let buff_num = parseInt(_bn);
        if(isNaN(buff_num) || buff_num > MAX_BUFF_NUM || buff_num < 1){
            return false;
        }
        let board_len = parseInt(_b);
        if(isNaN(board_len) || board_len < MIN_BOARD_LENGTH || board_len > MAX_BOARD_LENGTH){
            return false;
        }
        let hue = parseInt(_h);
        if(isNaN(hue) || hue < 0){
            return false;
        }
        let rotate = parseInt(_r);
        if(isNaN(rotate) || rotate < 0 || rotate > 1){
            return false;
        }
        let gravity = parseInt(_g);
        if(isNaN(gravity) || gravity < -1 || gravity > 1){
            return false;
        }
        let obstacles_str =_o;
        if(!/^\d+$/.test(obstacles_str) || (obstacles_str.length % 2 != 0 && obstacles_str != '0')){
            return false;
        }
        let puzzles_strs = _p;
        for(let i = 0; i < puzzles_strs.length; i++){
            let puzzles_str = puzzles_strs[i];
            if(!/^\d+$/.test(puzzles_str) || puzzles_str.length % 2 != 0){
                return false;
            }
        }
        //參數加入設定
        GameModel.setStage(stage);
        GameModel.setBuff(EBuffType.BD_SIZE, buff_size);
        GameModel.setBuff(EBuffType.BD_OBSTACLE, buff_obstacle);
        GameModel.setBuff(EBuffType.BD_ONECELL, buff_onecell);
        GameModel.setBuff(EBuffType.BD_REFRESH, buff_refresh);
        GameModel.setBuff(EBuffType.BD_BUFFNUM, buff_num);
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
        this.node.emit(EGameEvents.GE_PRELOADED, obstacle_set, _gs);
        return true;
    }

    //支援模式處理
    loadQueryString(_p:URLSearchParams):boolean
    {
        if(_p.has('b') && _p.has('h') && _p.has('r') && _p.has('g') && _p.has('o') && _p.has('p')){
            return this.loadStage('1', '0', '0', '0', '0', '2', _p.get('b'), _p.get('h'), _p.get('r'), _p.get('g'), _p.get('o'), _p.getAll('p'), EGameState.GS_HELP);
        }
        return false;
    }

    //產生query string
    setQueryString()
    {
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

    //產生cookie
    saveCookie()
    {
        let expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        let cookie_str = 'v1'; //版本記號, 格式改變時判斷用(因puzzle資訊長度不固定不能用長度判斷)
        cookie_str += '&' + GameModel.getStage().toString(); //關卡
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_SIZE).toString();    //大小buff
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_OBSTACLE).toString();//缺格buff
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_ONECELL).toString(); //1x1buff
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_REFRESH).toString(); //持有刷新次數
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_BUFFNUM).toString(); //持有選項量
        let board = GameModel.getBoard().map(v => v.slice());
        cookie_str += '&' + board.length.toString() //底板大小
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_HUE).toString();     //色差buff
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_ROTATE).toString();  //旋轉buff
        cookie_str += '&' + GameModel.getBuff(EBuffType.BD_GRAVITY).toString(); //重力buff
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
            cookie_str += '&0';
        }
        else{
            cookie_str += '&' + o;
        }
        //拼圖形狀
        let puzzles = GameModel.getPuzzles().map(v0 => v0.map(v1 => v1.slice()));
        for(let i = 0; i < puzzles.length; i++){
            cookie_str += '&';
            for(let j = 0; j < puzzles[i].length; j++){
                let [x, y] = puzzles[i][j];
                cookie_str += x.toString() + y.toString(); //xy一組
            }
        }
        document.cookie = 'save=' + cookie_str + '; expires=' + expires + '; path=/';
    }

    //讀取cookie
    loadCookie()
    {
        let match = document.cookie.match(new RegExp('(?:^|; )save=([^;]*)'));
        if(match){
            let parts = match[1].split('&');
            let _p:string[] = [];
            for(let i = 12; i < parts.length; i++){ //12以後到底都是puzzle資訊
                _p.push(parts[i]);
            }
            this.loadStage(parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9], parts[10], parts[11], _p, EGameState.GS_CONTINUE);
        }
    }
}


