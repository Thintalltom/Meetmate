"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CluRecognizer = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class CluRecognizer {
    constructor() {
        this.predictionUrl = process.env.CLU_ENDPOINT;
        this.apiKey = process.env.CLU_API_KEY;
        this.projectName = process.env.CLU_PROJECT_NAME;
        this.deploymentName = process.env.CLU_DEPLOYMENT_NAME;
    }
    async executeCluQuery(context) {
        const userInput = context.activity.text;
        const response = await axios_1.default.post(`${this.predictionUrl}/:analyze-conversations?api-version=2024-11-15-preview`, {
            kind: "Conversation",
            analysisInput: {
                conversationItem: {
                    participantId: "user1",
                    id: "1",
                    modality: "text",
                    language: "en",
                    text: userInput
                },
                loggingOptOut: false
            },
            parameters: {
                projectName: this.projectName,
                deploymentName: this.deploymentName,
                verbose: true
            }
        }, {
            headers: {
                'Ocp-Apim-Subscription-Key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log("CLU response:", response);
        return { result: response.data };
    }
}
exports.CluRecognizer = CluRecognizer;
