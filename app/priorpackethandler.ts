import { PacketHandler } from "dimensions/extension";
import PlayerInfo from "./";
import PriorServerHandler from "./priorserverhandler";

class PriorPacketHandler implements PacketHandler {
    serverHandler: PriorServerHandler;

    constructor(playerInfo: PlayerInfo) {
        this.serverHandler = new PriorServerHandler(playerInfo);
    }
}

export default PriorPacketHandler;