import axios from 'axios';
import { TurnContext } from 'botbuilder';
import * as dotenv from 'dotenv';
dotenv.config();

export class CluRecognizer {
    private predictionUrl = process.env.CLU_ENDPOINT!;
    private apiKey = process.env.CLU_API_KEY!;
    private projectName = process.env.CLU_PROJECT_NAME!;
    private deploymentName = process.env.CLU_DEPLOYMENT_NAME!;

    async executeCluQuery(context: TurnContext): Promise<{ result: any }> {
        const userInput = context.activity.text;

        const response = await axios.post(
            `${this.predictionUrl}/:analyze-conversations?api-version=2024-11-15-preview`,
            {
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
            },
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("CLU response:", response);

        return { result: response.data };
    }
}
