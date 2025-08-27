import type { Database } from "@midday/db/client";
import { getInboxById, getTransactionById } from "@midday/db/queries";
import type { MatchResult } from "@midday/db/queries/transaction-matching";
import { logger, tasks } from "@trigger.dev/sdk";

// Helper function to trigger appropriate notifications based on matching results
export async function triggerMatchingNotification({
  db,
  teamId,
  inboxId,
  result,
}: {
  db: Database;
  teamId: string;
  inboxId: string;
  result: {
    action: "auto_matched" | "suggestion_created";
    suggestion: MatchResult;
  };
}) {
  try {
    // Get inbox and transaction details
    const [inboxItem, transactionItem] = await Promise.all([
      getInboxById(db, { id: inboxId, teamId }),
      getTransactionById(db, { id: result.suggestion.transactionId, teamId }),
    ]);

    if (!inboxItem || !transactionItem) {
      logger.warn("Missing data for notification", {
        hasInbox: !!inboxItem,
        hasTransaction: !!transactionItem,
      });
      return;
    }

    const documentName =
      inboxItem.displayName || inboxItem.fileName || "Document";
    const transactionName = transactionItem.name || "Transaction";

    // Check if this is a cross-currency match
    const isCrossCurrency =
      inboxItem.currency &&
      transactionItem.currency &&
      inboxItem.currency !== transactionItem.currency;

    if (isCrossCurrency) {
      // Trigger cross-currency notification
      await tasks.trigger("notification", {
        type: "inbox_cross_currency_matched",
        teamId,
        inboxId,
        transactionId: result.suggestion.transactionId,
        documentName,
        documentAmount: inboxItem.amount || 0,
        documentCurrency: inboxItem.currency || "USD",
        transactionAmount: transactionItem.amount,
        transactionCurrency: transactionItem.currency || "USD",
        transactionName,
        confidenceScore: result.suggestion.confidenceScore,
        matchType: result.suggestion.matchType,
      });

      logger.info("Triggered cross-currency match notification", {
        teamId,
        inboxId,
        transactionId: result.suggestion.transactionId,
      });
    } else if (result.action === "auto_matched") {
      // Trigger auto-matched notification
      await tasks.trigger("notification", {
        type: "inbox_auto_matched",
        teamId,
        inboxId,
        transactionId: result.suggestion.transactionId,
        documentName,
        amount: inboxItem.amount || 0,
        currency: inboxItem.currency || transactionItem.currency || "USD",
        transactionName,
        confidenceScore: result.suggestion.confidenceScore,
        matchType: result.suggestion.matchType as "auto_matched",
        isCrossCurrency,
      });

      logger.info("Triggered auto-match notification", {
        teamId,
        inboxId,
        transactionId: result.suggestion.transactionId,
      });
    } else if (result.action === "suggestion_created") {
      // Trigger needs review notification
      await tasks.trigger("notification", {
        type: "inbox_needs_review",
        teamId,
        inboxId,
        transactionId: result.suggestion.transactionId,
        documentName,
        amount: inboxItem.amount || 0,
        currency: inboxItem.currency || transactionItem.currency || "USD",
        transactionName,
        confidenceScore: result.suggestion.confidenceScore,
        matchType: result.suggestion.matchType as
          | "high_confidence"
          | "suggested",
        isCrossCurrency,
      });

      logger.info("Triggered needs review notification", {
        teamId,
        inboxId,
        transactionId: result.suggestion.transactionId,
      });
    }
  } catch (error) {
    logger.error("Failed to trigger matching notification", {
      teamId,
      inboxId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't throw - notifications shouldn't break the matching process
  }
}
