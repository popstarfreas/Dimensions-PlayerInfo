import Client from "dimensions/client";
import TerrariaServerPacketHandler from "dimensions/extension/terrariaserverpackethandler";
import ListenServer from "dimensions/listenserver";
import Packet from "dimensions/packet";
import PacketReader from "dimensions/packets/packetreader";
import PacketWriter from "dimensions/packets/packetwriter";
import PacketTypes from "dimensions/packettypes";
import TerrariaServer from "dimensions/terrariaserver";
import PlayerInfo from "./";

class PriorServerHandler extends TerrariaServerPacketHandler {
    protected _playerInfo: PlayerInfo;

    constructor(playerInfo: PlayerInfo) {
        super();
        this._playerInfo = playerInfo;
    }

    public handlePacket(server: TerrariaServer, packet: Packet): boolean {
        let handled = false;
        switch (packet.packetType) {
            case PacketTypes.DimensionsUpdate:
                handled = this.handleDimensionsUpdate(server, packet);
                break;
        }

        return handled;
    }

    private handleDimensionsUpdate(server: TerrariaServer, packet: Packet): boolean {
        let handled = false;
        const reader = new PacketReader(packet.data);
        const messageType: number = reader.readInt16();

        if (messageType === 4) {
            const playerName = reader.readString();
            const client = this.findClientWithName(playerName);

            let response: string;
            if (client !== null) {
                const writer = new PacketWriter()
                    .setType(PacketTypes.DimensionsUpdate)
                    .packInt16(messageType)
                    .packString(playerName)
                    .packByte(1) // success: true
                    .packString(client.server.name)
                    .packSingle(client.player.position.x)
                    .packSingle(client.player.position.y)
                    .packByte(client.player.inventory.length);
                
                for (const item of client.player.inventory) {
                    writer
                        .packByte(item.slot)
                        .packInt16(item.stack)
                        .packByte(item.prefix)
                        .packInt16(item.netID);
                }

                response = writer.data;
            } else {
                response = new PacketWriter()
                    .setType(PacketTypes.DimensionsUpdate)
                    .packInt16(messageType)
                    .packString(playerName)
                    .packByte(0)
                    .data;
            }
            
            server.socket.write(new Buffer(response, "hex"));
            handled = true;
        }

        return handled;
    }

    /**
     * Finds a client by their name in all listen servers
     *
     * @param playerName The name of the client to find
     */
    private findClientWithName(playerName: string): Client | null {
        let client: Client | null = null;
        for (const index in this._playerInfo.listenServers) {
            if (this._playerInfo.listenServers.hasOwnProperty(index)) {
                client = this.findClientInListenServer(this._playerInfo.listenServers[index], playerName);
                if (client !== null) {
                    break;
                }
            }
        }

        return client;
    }

    /**
     * Finds a client if it exists in a listenserver by name
     *
     * @param listenServer The listen server to search
     * @param playerName The name of the player to match
     */
    private findClientInListenServer(listenServer: ListenServer, playerName: string): Client | null {
        let matchedClient: Client | null = null;
        for (const client of listenServer.clients) {
            if (client.player.name === playerName) {
                matchedClient = client;
                break;
            }
        }

        return matchedClient;
    }
}

export default PriorServerHandler;