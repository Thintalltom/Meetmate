import {
  ActivityHandler,
  StatePropertyAccessor,
  TurnContext,
  ConversationState,
  CardFactory,
  MessageFactory,
} from "botbuilder";
import { CluRecognizer } from "./recongnizer/cluRecognizer";
import { msalInstance } from "./authProvider";
import axios from "axios";
import { getDelegatedToken } from "./getDelegatedToken";
interface BookingInfo {
  destination?: string;
  date?: string;
  awaitingDestination?: boolean;
  awaitingDate?: boolean;
  awaitingCalendarConfirmation?: boolean;
}
let accessToken;
export class CluBot extends ActivityHandler {
  private cluRecognizer = new CluRecognizer();
  private bookingStateAccessor: StatePropertyAccessor<BookingInfo>;
  constructor(private conversationState: ConversationState) {
    super();
    this.bookingStateAccessor =
      this.conversationState.createProperty<BookingInfo>("BookingInfo");

    this.onMessage(async (context, next) => {
      try {
        const bookingInfo = await this.bookingStateAccessor.get(context, {});
        const userInput = context.activity.text;
        if (bookingInfo.awaitingDestination) {
          bookingInfo.destination = userInput;
          bookingInfo.awaitingDestination = false;
          bookingInfo.awaitingDate = true;
          await context.sendActivity(
            `Awesome! When would you like to travel to ${userInput}?`
          );
          await this.bookingStateAccessor.set(context, bookingInfo);
          await this.conversationState.saveChanges(context);
          return;
        }

        if (bookingInfo.awaitingDate) {
          bookingInfo.date = userInput;
          bookingInfo.awaitingCalendarConfirmation = true;
          // 2.1 Show Yes/No card
          const card = CardFactory.heroCard(
            "Would you like me to book this in your Outlook calendar?",
            [],
            [
              {
                type: "imBack",
                title: "Yes, book it",
                value: "Yes",
              },
              {
                type: "imBack",
                title: "No, thanks",
                value: "No",
              },
            ]
          );
          const message = MessageFactory.attachment(card);
          await context.sendActivity(message);
          await this.bookingStateAccessor.set(context, bookingInfo);
          await this.conversationState.saveChanges(context);
          return;
        }
        if (bookingInfo.awaitingCalendarConfirmation) {
          const normalizedInput = userInput.trim().toLowerCase();
          if (normalizedInput === "yes" || normalizedInput === "yes, book it") {
            // 3.1 Book using MS Graph
            // try {
            //       const result = await msalInstance.acquireTokenByClientCredential({
            //   scopes: ["https://graph.microsoft.com/.default"],
            // });
            // accessToken = result?.accessToken
            // console.log('access token', accessToken)

            // } catch (error) {
            //   console.error("Error acquiring token:", error);
            //   await context.sendActivity(
            //     "I couldn't get access to your Outlook calendar. Please check your permissions."
            //   );
            //   return;

            // }
            accessToken = await getDelegatedToken();
            if (!accessToken) {
              await context.sendActivity(
                "Sorry, I couldn't get access to your calendar. Please ensure you've signed in properly."
              );
              return;
            }
            const event = {
              subject: `Flight to ${bookingInfo.destination}`,
              start: {
                dateTime: `${bookingInfo.date}T10:00:00`,
                timeZone: "UTC",
              },
              end: {
                dateTime: `${bookingInfo.date}T12:00:00`,
                timeZone: "UTC",
              },
              body: {
                contentType: "HTML",
                content: `You booked a flight to ${bookingInfo.destination}.`,
              },
              location: {
                displayName: bookingInfo.destination,
              },
              attendees: [],
            };

          //  const userEmail = "adeyanjutomide@gmail.com";

            const response = await axios.post(
              `https://graph.microsoft.com/v1.0/me/events`,
              event,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );
            console.log("🔐 Auth Header:", {
              Authorization: `Bearer ${accessToken}`,
            });
            console.log("response ", response);

            await context.sendActivity(
              " Your trip has been booked on Outlook Calendar!"
            );
            bookingInfo.awaitingCalendarConfirmation = false;
          } else {
            await context.sendActivity(
              "Alright! I won't book it in your calendar."
            );
          }

          bookingInfo.awaitingCalendarConfirmation = false;
          await this.bookingStateAccessor.set(context, bookingInfo);
          await this.conversationState.saveChanges(context);
          return;
        }

        const cluResult = await this.cluRecognizer.executeCluQuery(context);
        const prediction = cluResult.result?.result.prediction;
        const topIntent = prediction.topIntent;
        if (topIntent === "BookFlight") {
          const destinationEntity = prediction.entities?.find(
            (e: { category: string }) => e.category === "Destination"
          );

          if (!destinationEntity) {
            bookingInfo.awaitingDestination = true;
            await context.sendActivity("Sure! Where would you like to go?");
          } else {
            bookingInfo.destination = destinationEntity.text;
            bookingInfo.awaitingDate = true;
            await context.sendActivity(
              `Great! When would you like to travel to ${destinationEntity.text}?`
            );
          }

          await this.bookingStateAccessor.set(context, bookingInfo);
          await this.conversationState.saveChanges(context);
        } else {
          await context.sendActivity(
            `I can only help book flight and save important details in your outlook**.`
          );
        }
      } catch (error) {
        console.error("CLU error:", error);
        await context.sendActivity(
          "Sorry, I encountered an error understanding you."
        );
      }

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      await context.sendActivity(
        "Hello! I'm your MeetMate Bot. Type something and I'll try to understand."
      );
      await next();
    });
  }
}
