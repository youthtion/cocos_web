import { _decorator, Component, Node, Prefab, instantiate, Sprite, Color, Input, EventMouse, input, Vec3, UITransform, CCFloat } from 'cc';
import { CELL_WIDTH, FIT_ALLOW, GameModel } from './GameModel'
const { ccclass, property } = _decorator;

//滑鼠點擊類型(對應event.getButton)
enum EMouseType{
    MT_LEFT, //左鍵
    MT_MID,  //中鍵
    MT_RIGHT,//右鍵
}

@ccclass('PuzzleController')
export class PuzzleController extends Component {

    @property({type:Prefab})
    private cellPrefab:Prefab|null = null;
    @property({type:CCFloat, min:0, max:1, step:0.01})
    private cellSaturation:number = 0;
    @property({type:CCFloat, min:0, max:1, step:0.01})
    private cellLightness:number = 0; 

    start()
    {
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    update(deltaTime: number){}

    initPuzzle()
    {
        if(!this.cellPrefab){
            return;
        }
        let board:number[][] = GameModel.getBoard();
        let puzzles:number[][][] = GameModel.getPuzzles().map(v0 => v0.map(v1 => v1.slice()));
        this.node.removeAllChildren();
        let colors:Color[] = this.generateHueColors(puzzles.length);
        for(let i = 0; i < puzzles.length; i++){
            let puzzle:Node = new Node("" + i);
            let [bx, by] = puzzles[i][0];
            for(let j = 0; j < puzzles[i].length; j++){
                let cell:Node|null = instantiate(this.cellPrefab);
                if(cell){
                    puzzle.addChild(cell);
                    let [x, y] = puzzles[i][j];
                    cell.setPosition((x - bx) * CELL_WIDTH, (y - by) * CELL_WIDTH, 0);
                    let cell_sprite = cell.getComponent(Sprite);
                    if(cell_sprite){
                        cell_sprite.color = colors[i];
                    }
                    cell.on(Input.EventType.MOUSE_DOWN, (event: EventMouse) => {this.onMouseDown(event, puzzle);}, this);
                    cell.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
                    cell.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
                }
            }
            puzzle.eulerAngles = new Vec3(puzzle.eulerAngles.x, puzzle.eulerAngles.y, puzzle.eulerAngles.z + 90 * Math.floor(Math.random() * 4));
            puzzle.setPosition((board.length * CELL_WIDTH * (-1)), 0, 0);
            this.node.addChild(puzzle);
        }
    }

    onMouseDown(_event: EventMouse, _puzzle:Node)
    {
        if(!_puzzle.parent){
            return;
        }
        _puzzle.setSiblingIndex(_puzzle.parent.children.length - 1);
        this.getFitCell(_puzzle);
        if(this.fitCells.length == _puzzle.children.length){
            this.node.emit('onRemovePuzzle', this.fitCells, _puzzle.name);
        }
        if(_event.getButton() == EMouseType.MT_RIGHT){
            //將屏幕座標轉換為父節點空間坐標
            let cur_pos = new Vec3(_event.getUILocation().x, _event.getUILocation().y, 0); //屏幕座標
            let pos_in_parent = _puzzle.parent.getComponent(UITransform).convertToNodeSpaceAR(cur_pos);
            //計算點對puzzle的偏移量
            let puzzle_pos = _puzzle.getPosition();
            let offset = new Vec3(pos_in_parent.x - puzzle_pos.x, pos_in_parent.y - puzzle_pos.y, 0);
            //旋轉弧度
            let [cos, sin] = [Math.cos(Math.PI / (-2)), Math.sin(Math.PI / (-2))];
            let [rx, ry] = [offset.x * cos - offset.y * sin, offset.x * sin + offset.y * cos];
            // 新位置 = 旋轉中心 - 旋轉後的偏移量
            let [nx, ny] = [pos_in_parent.x - rx, pos_in_parent.y - ry];
            _puzzle.setPosition(nx, ny, 0);
            _puzzle.eulerAngles = new Vec3(_puzzle.eulerAngles.x, _puzzle.eulerAngles.y, (_puzzle.eulerAngles.z - 90) % 360);
        }
        else if(_event.getButton() == EMouseType.MT_LEFT && !this.dragPuzzle){
            this.puzzleStartPos.set(_puzzle.getPosition());
            this.dragStartPos.set(_event.getUILocation().x, _event.getUILocation().y, 0);
            this.dragPuzzle = _puzzle;
        }
    }

    onMouseMove(_event: EventMouse)
    {
        if(this.dragPuzzle){
            let cur_pos = _event.getUILocation();
            let [dx, dy] = [this.dragStartPos.x - cur_pos.x, this.dragStartPos.y - cur_pos.y];
            this.dragPuzzle.setPosition(this.puzzleStartPos.x - dx, this.puzzleStartPos.y - dy);
        }
    }

    onMouseUp(_event: EventMouse)
    {
        if(this.dragPuzzle){
            if(this.dragPuzzle.parent){
                this.getFitCell(this.dragPuzzle);
                if(this.fitCells.length == this.dragPuzzle.children.length){
                    this.node.emit('onFitPuzzle', this.fitCells, this.dragPuzzle.name);
                    return;
                }
            }
            this.dragPuzzle = null;
        }
    }

    getFitCell(_puzzle:Node)
    {
        let [dx, dy] = [0, 0];
        this.fitCells = [];
        let board:number[][] = GameModel.getBoard();
        for(let i = 0; i < _puzzle.children.length; i++){
            let cur_pos = _puzzle.children[i].getWorldPosition();
            let pos_in_parent = _puzzle.parent.getComponent(UITransform).convertToNodeSpaceAR(cur_pos);
            let [x, y] = [pos_in_parent.x, pos_in_parent.y];
            if(Math.abs(x) > CELL_WIDTH * (board.length - 1) / 2 + FIT_ALLOW || Math.abs(y) > CELL_WIDTH * (board.length - 1) / 2 + FIT_ALLOW){
                break;
            }
            if(board.length % 2 == 0){
                [x, y] = [x + CELL_WIDTH * 0.5, y + CELL_WIDTH * 0.5];
            }
            if(Math.abs(x % CELL_WIDTH) > FIT_ALLOW && Math.abs(x % CELL_WIDTH) < CELL_WIDTH - FIT_ALLOW){
                break;
            }
            if(Math.abs(y % CELL_WIDTH) > FIT_ALLOW && Math.abs(y % CELL_WIDTH) < CELL_WIDTH - FIT_ALLOW){
                break;
            }
            if(dx == 0 && dy == 0){
                dx = (x % CELL_WIDTH + CELL_WIDTH) % CELL_WIDTH;
                if(dx > FIT_ALLOW){
                    dx -= CELL_WIDTH;
                }
                dy = (y % CELL_WIDTH + CELL_WIDTH) % CELL_WIDTH;
                if(dy > FIT_ALLOW){
                    dy -= CELL_WIDTH;
                }
                let puzzle_pos = _puzzle.getPosition();
                this.fitPuzzlePos = [puzzle_pos.x - dx, puzzle_pos.y - dy];
            }
            this.fitCells.push([Math.round((x - dx) / CELL_WIDTH + Math.floor((board.length - 1) / 2)), Math.round((y - dy) / CELL_WIDTH + Math.floor((board.length - 1) / 2))]);
        }
    }

    onFitPuzzleCallback(_success:boolean)
    {
        if(this.dragPuzzle && _success){
            this.dragPuzzle.setPosition(this.fitPuzzlePos[0], this.fitPuzzlePos[1], 0);
            this.fitPuzzlePos = [0, 0];
        }
        this.dragPuzzle = null;
    }

    hslToRgb(_h:number, _s:number, _l:number): [number, number, number]
    {
        let r:number, g:number, b:number;
        if (_s == 0){
            r = g = b = _l;
        }
        else{
            let hue2rgb = (_p:number, _q:number, _t:number) => {
                if (_t < 0) _t += 1;
                if (_t > 1) _t -= 1;
                if (_t < 1 / 6) return _p + (_q - _p) * 6 * _t;
                if (_t < 1 / 2) return _q;
                if (_t < 2 / 3) return _p + (_q - _p) * (2 / 3 - _t) * 6;
                return p;
            };
            let q = _l < 0.5 ? _l * (1 + _s) : _l + _s - _l * _s;
            let p = 2 * _l - q;
            r = hue2rgb(p, q, _h + 1 / 3);
            g = hue2rgb(p, q, _h);
            b = hue2rgb(p, q, _h - 1 / 3);
        }
        return [r * 255, g * 255, b * 255];
    }

    generateHueColors(_n:number): Color[]
    {
        let colors:Color[] = [];
        for (let i = 0; i < _n; i++) {
            let h = i / _n;
            let [r, g, b] = this.hslToRgb(h, this.cellSaturation, this.cellLightness);
            colors.push(new Color(r, g, b));
        }
        return colors;
    }

    private fitCells:number[][] = [];
    private fitPuzzlePos:number[] = [0, 0];
    private dragPuzzle:Node|null = null;
    private dragStartPos:Vec3 = new Vec3();
    private puzzleStartPos:Vec3 = new Vec3();
}


