import { defineProperties, FetchRequest, throwArgumentError, throwError } from "../utils/index.js";
import { showThrottleMessage } from "./community.js";
import { Network } from "./network.js";
import { JsonRpcProvider } from "./provider-jsonrpc.js";
import { WebSocketProvider } from "./provider-websocket.js";
const defaultProjectId = "84842078b09946638c03157f83405213";
function getHost(name) {
    switch (name) {
        case "mainnet":
            return "mainnet.infura.io";
        case "goerli":
            return "goerli.infura.io";
        case "sepolia":
            return "sepolia.infura.io";
        case "arbitrum":
            return "arbitrum-mainnet.infura.io";
        case "arbitrum-goerli":
            return "arbitrum-goerli.infura.io";
        case "matic":
            return "polygon-mainnet.infura.io";
        case "maticmum":
            return "polygon-mumbai.infura.io";
        case "optimism":
            return "optimism-mainnet.infura.io";
        case "optimism-goerli":
            return "optimism-goerli.infura.io";
    }
    return throwArgumentError("unsupported network", "network", name);
}
export class InfuraWebSocketProvider extends WebSocketProvider {
    projectId;
    projectSecret;
    constructor(network, apiKey) {
        const provider = new InfuraProvider(network, apiKey);
        const req = provider._getConnection();
        if (req.credentials) {
            throwError("INFURA WebSocket project secrets unsupported", "UNSUPPORTED_OPERATION", {
                operation: "InfuraProvider.getWebSocketProvider()"
            });
        }
        const url = req.url.replace(/^http/i, "ws").replace("/v3/", "/ws/v3/");
        super(url, network);
        defineProperties(this, {
            projectId: provider.projectId,
            projectSecret: provider.projectSecret
        });
    }
    isCommunityResource() {
        return (this.projectId === defaultProjectId);
    }
}
export class InfuraProvider extends JsonRpcProvider {
    projectId;
    projectSecret;
    constructor(_network = "mainnet", projectId, projectSecret) {
        const network = Network.from(_network);
        if (projectId == null) {
            projectId = defaultProjectId;
        }
        if (projectSecret == null) {
            projectSecret = null;
        }
        const request = InfuraProvider.getRequest(network, projectId, projectSecret);
        super(request, network, { staticNetwork: network });
        defineProperties(this, { projectId, projectSecret });
    }
    _getProvider(chainId) {
        try {
            return new InfuraProvider(chainId, this.projectId, this.projectSecret);
        }
        catch (error) { }
        return super._getProvider(chainId);
    }
    isCommunityResource() {
        return (this.projectId === defaultProjectId);
    }
    static getWebSocketProvider(network, apiKey) {
        return new InfuraWebSocketProvider(network, apiKey);
    }
    static getRequest(network, projectId, projectSecret) {
        if (projectId == null) {
            projectId = defaultProjectId;
        }
        if (projectSecret == null) {
            projectSecret = null;
        }
        const request = new FetchRequest(`https:/\/${getHost(network.name)}/v3/${projectId}`);
        request.allowGzip = true;
        if (projectSecret) {
            request.setCredentials("", projectSecret);
        }
        if (projectId === defaultProjectId) {
            request.retryFunc = async (request, response, attempt) => {
                showThrottleMessage("InfuraProvider");
                return true;
            };
        }
        return request;
    }
}
//# sourceMappingURL=provider-infura.js.map