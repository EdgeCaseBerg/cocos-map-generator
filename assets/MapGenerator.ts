
import { _decorator, Component, CCInteger, CCBoolean, CCString, SystemEvent, systemEvent, Prefab, instantiate, Vec3, EventMouse} from 'cc';
import { PseudoRandom } from './PseudoRandom';
const { ccclass, property } = _decorator;

/** Following tutorials that are meant for unity and making them happen in cocos
 * https://www.youtube.com/watch?v=v7yyZZjF1z4
 */

@ccclass('MapGenerator')
export class MapGenerator extends Component {

    @property({type: CCInteger})
    public width: number = 256;

    @property({type: CCInteger})
    public height: number = 128;

    @property({type: CCInteger, range: [0, 100, 1], slide: true})
    public randomFillPercent: number = 40;

    @property({type: CCString})
    public seed: string;
    
    @property({type: CCBoolean})
    public useRandomSeed: boolean;

    map: Array<Array<number>> = [];

    @property({type: CCInteger})
    mapSmoothingIterations = 5;

    start () {
        this.generateMap();
        systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    onMouseUp (eventMouse: EventMouse) {
        if (eventMouse.getButton() === EventMouse.BUTTON_LEFT) {
            this.generateMap();
        }
    }

    generateMap() {
        this.map = [];
        for (let x = 0; x < this.width; x++) {
            this.map.push([]);
            for (let y = 0; y < this.height; y++) {
                this.map[x][y] = 1;
            }
        }

        this.randomFillMap()
        
        for (let i = 0; i < this.mapSmoothingIterations; i++) {
            this.smoothMap();
        }

        this.generateCubes();
    }

    randomFillMap() {
        if (this.useRandomSeed) {
            this.seed = new Date().toString()
        }

        let pseudoRandom = new PseudoRandom(this.seed);

        /* Figure out random seeding... it's not built in */
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                /* If we're on the edge, set a wall. */
                if (x == 0 || y == 0 || x == this.width - 1 || y == this.height - 1) {
                    this.map[x][y] = 1;
                } else {
                    /* otherwise, set the block to a random 1 or 0 to indicate wall or not */
                    const r = pseudoRandom.next(0, 100);
                    this.map[x][y] = (r < this.randomFillPercent ? 1 : 0);
                }
            }
        }
    }

    smoothMap() {
        /* Don't modify the map in place or else we'll skew the results */
        let mapCopy = []
        for (let x = 0; x < this.width; x++) {
            mapCopy.push([]);
            for (let y = 0; y < this.height; y++) {
                mapCopy[x][y] = 1;
            }
        }

        /* For each tile */
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                /* We want to know how many neighbors this tile has */
                let numberOfNeighborWalls = this.getSurroundingWallCount(x, y);

                /* Arbitrary rules */
                if (numberOfNeighborWalls > 4) {
                    mapCopy[x][y] = 1;
                } else if (numberOfNeighborWalls < 4) {
                    mapCopy[x][y] = 0;
                } else {
                    /* let it stay as the random bit it was */
                }
            }
        }

        /* Copy the smoothed map over to the real map */
        this.map = mapCopy;
    }

    getSurroundingWallCount(gridX: number, gridY: number): number {
        let wallCount = 0;
        /* For the 3x3 grid centered at gridX, gridY */
        for (let neighborX = gridX - 1; neighborX <= gridX + 1; neighborX++) {
            for (let neighborY = gridY - 1; neighborY <= gridY + 1; neighborY++) {
                /* If we're within the bounds of the map */
                if (neighborX >= 0 && neighborY >= 0 && neighborX < this.width && neighborY < this.height) {
                    /* and we're not looking at ourselves */
                    if (!(neighborX == gridX && neighborY == gridY)) {
                        wallCount += this.map[neighborX][neighborY];
                    }
                } else {
                    /* Not in bounds? Consider it a wall. */
                    wallCount++;
                }
            }
        }
        return wallCount;
    }

    /* Debugging code (I think?) */
    @property({type: Prefab})
    public cubePrefab: Prefab = null;

    generateCubes() {
        /* When we generate, remove anything existing */
        if (!this.cubePrefab) {
            console.log('No cube prefab set.');
            return;
        }

        this.node.removeAllChildren();

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.map[x][y] === 1) {
                    let block = instantiate(this.cubePrefab);
                    block.setPosition(new Vec3(x, y, 0));
                    this.node.addChild(block);
                }
            }
        }
    }


}
