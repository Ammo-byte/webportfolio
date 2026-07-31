import type { ExperienceSceneName } from "../data/experience";
import {
  box,
  drawCheck,
  drawComparisonMatrix,
  drawContainer,
  drawCustomerCard,
  drawDatabase,
  drawMetricCard,
  drawPerson,
  drawPixelText,
  drawRankedDocument,
  drawRegisterBank,
  drawSourceCard,
  drawMessageCard,
  drawTarget,
  drawTextChip,
  fadeAfter,
  line,
  progressiveDashedPath,
  progressivePath,
  progressivePolyline,
  progressBetween,
  withAlpha,
  type PixelPoint,
  type ScenePalette,
} from "./experience-primitives";

export interface ExperienceSceneSpec {
  durationFrames: number;
  staticFrame: number;
  phaseAt(frame: number): number;
  render(
    context: CanvasRenderingContext2D,
    frame: number,
    colors: ScenePalette,
  ): void;
}

const phaseAt = (
  frame: number,
  secondPhase: number,
  thirdPhase: number,
  fadeStart: number,
): number => {
  if (frame >= fadeStart) return -1;
  if (frame >= thirdPhase) return 2;
  if (frame >= secondPhase) return 1;
  return 0;
};

const automationSpec: ExperienceSceneSpec = {
  durationFrames: 95,
  staticFrame: 80,
  phaseAt: (frame) => phaseAt(frame, 23, 55, 89),
  render: (context, frame, colors) => {
    const request = progressBetween(frame, 0, 22);
    const automate = progressBetween(frame, 23, 54);
    const complete = progressBetween(frame, 55, 73);
    const activeAlpha = fadeAfter(frame, 89, 94);
    const inputs = [
      { label: "CLAIM", y: 7, pathY: 13 },
      { label: "RCPT", y: 35, pathY: 41 },
      { label: "POLICY", y: 63, pathY: 69 },
    ];

    inputs.forEach((input, index) => {
      drawTextChip(context, 6, input.y, input.label, colors.faint);
      progressivePath(
        context,
        [
          { x: 38, y: input.pathY },
          { x: 50, y: input.pathY },
          { x: 60, y: 42 + (index - 1) * 6 },
          { x: 68, y: 42 + (index - 1) * 6 },
        ],
        progressBetween(request, index * 0.16, 0.72 + index * 0.08),
        colors,
        1,
      );
    });
    drawDatabase(context, 68, 16, 60, 52, colors.faint, "FLOW");
    drawMetricCard(
      context,
      145,
      19,
      58,
      "STATUS",
      "DONE",
      colors.faint,
      1,
    );

    withAlpha(context, activeAlpha, () => {
      inputs.forEach((input, index) => {
        withAlpha(
          context,
          progressBetween(request, index * 0.16, 0.72 + index * 0.08),
          () => drawTextChip(context, 6, input.y, input.label, colors.blue),
        );
      });
      withAlpha(context, automate, () => {
        drawDatabase(context, 68, 16, 60, 52, colors.blue, "FLOW");
        drawPixelText(context, "AUTO", 90, 35, colors.blue);
        [78, 93, 108].forEach((x, index) => {
          withAlpha(
            context,
            progressBetween(automate, index * 0.18, 0.62 + index * 0.12),
            () => box(context, x, 52, 5, 5, colors.blue, true),
          );
        });
      });
      progressivePath(
        context,
        [
          { x: 128, y: 42 },
          { x: 137, y: 42 },
          { x: 144, y: 35 },
          { x: 145, y: 35 },
        ],
        complete,
        colors,
        2,
      );
      withAlpha(context, complete, () => {
        drawMetricCard(
          context,
          145,
          19,
          58,
          "STATUS",
          "DONE",
          colors.blue,
          complete,
        );
        if (complete > 0.72) drawCheck(context, 185, 56, colors.blue);
      });
    });
  },
};

const growthSpec: ExperienceSceneSpec = {
  durationFrames: 93,
  staticFrame: 78,
  phaseAt: (frame) => phaseAt(frame, 24, 54, 87),
  render: (context, frame, colors) => {
    const signals = progressBetween(frame, 0, 23);
    const segments = progressBetween(frame, 24, 53);
    const insight = progressBetween(frame, 54, 70);
    const activeAlpha = fadeAfter(frame, 87, 92);
    const sources = [
      { label: "PUSH", y: 7 },
      { label: "BRAZE", y: 34 },
      { label: "CAMP", y: 61 },
    ];
    const cohorts = [
      { label: "REG", y: 5, people: 2 },
      { label: "LIVE", y: 31, people: 3 },
      { label: "REACH", y: 57, people: 2 },
    ];
    const sourcePaths: PixelPoint[][] = [
      [
        { x: 40, y: 15 },
        { x: 52, y: 15 },
        { x: 62, y: 13 },
        { x: 72, y: 13 },
      ],
      [
        { x: 40, y: 42 },
        { x: 53, y: 42 },
        { x: 62, y: 39 },
        { x: 72, y: 39 },
      ],
      [
        { x: 40, y: 69 },
        { x: 52, y: 69 },
        { x: 62, y: 65 },
        { x: 72, y: 65 },
      ],
    ];
    const chartPoints = [
      { x: 147, y: 61 },
      { x: 157, y: 54 },
      { x: 168, y: 56 },
      { x: 178, y: 43 },
      { x: 189, y: 33 },
      { x: 198, y: 17 },
    ];

    sources.forEach((source, index) => {
      drawSourceCard(context, 6, source.y, source.label, colors.faint);
      progressivePath(context, sourcePaths[index], signals, colors, 1);
    });
    cohorts.forEach((cohort) => {
      box(context, 72, cohort.y, 53, 22, colors.faint);
      drawPixelText(context, cohort.label, 76, cohort.y + 4, colors.faint);
      Array.from({ length: cohort.people }, (_, index) => index).forEach(
        (personIndex) => {
          drawPerson(
            context,
            96 + personIndex * 9,
            cohort.y + 6,
            colors.faint,
          );
        },
      );
    });
    withAlpha(context, activeAlpha, () => {
      sources.forEach((source, index) => {
        withAlpha(
          context,
          progressBetween(signals, index * 0.18, 0.72 + index * 0.08),
          () => drawSourceCard(context, 6, source.y, source.label, colors.blue),
        );
      });
      cohorts.forEach((cohort, cohortIndex) => {
        const cohortProgress = progressBetween(
          segments,
          cohortIndex * 0.18,
          0.68 + cohortIndex * 0.1,
        );
        withAlpha(context, cohortProgress, () => {
          box(context, 72, cohort.y, 53, 22, colors.blue);
          drawPixelText(context, cohort.label, 76, cohort.y + 4, colors.blue);
          Array.from({ length: cohort.people }, (_, index) => index).forEach(
            (personIndex) => {
              withAlpha(
                context,
                progressBetween(
                  cohortProgress,
                  personIndex * 0.18,
                  0.72 + personIndex * 0.12,
                ),
                () =>
                  drawPerson(
                    context,
                    96 + personIndex * 9,
                    cohort.y + 6,
                    colors.blue,
                  ),
              );
            },
          );
        });
      });
      progressivePath(
        context,
        [
          { x: 125, y: 42 },
          { x: 134, y: 42 },
          { x: 140, y: 36 },
          { x: 143, y: 36 },
        ],
        progressBetween(segments, 0.58, 1),
        colors,
        2,
      );
      withAlpha(context, insight, () => {
        drawPixelText(context, "+25%", 159, 6, colors.blue);
        line(context, { x: 143, y: 66 }, { x: 202, y: 66 }, colors.blue);
        line(context, { x: 143, y: 66 }, { x: 143, y: 13 }, colors.blue);
        progressivePolyline(context, chartPoints, insight, colors, 2);
      });
      if (insight > 0.82) {
        box(context, 196, 15, 5, 5, colors.blue, true);
      }
    });
  },
};

const ragSpec: ExperienceSceneSpec = {
  durationFrames: 95,
  staticFrame: 80,
  phaseAt: (frame) => phaseAt(frame, 23, 55, 89),
  render: (context, frame, colors) => {
    const query = progressBetween(frame, 0, 22);
    const retrieve = progressBetween(frame, 23, 54);
    const answer = progressBetween(frame, 55, 73);
    const activeAlpha = fadeAfter(frame, 89, 94);
    const queryPath = [
      { x: 48, y: 41 },
      { x: 57, y: 41 },
      { x: 62, y: 35 },
      { x: 67, y: 35 },
    ];
    const documentPositions = [
      { x: 116, y: 4 },
      { x: 122, y: 31 },
      { x: 116, y: 58 },
    ];
    const documentPaths: PixelPoint[][] = documentPositions.map(
      (document, index) => [
        { x: 108, y: 35 + index * 4 },
        { x: 112, y: 35 + index * 4 },
        { x: document.x, y: document.y + 11 },
      ],
    );
    const evidencePaths: PixelPoint[][] = documentPositions.map(
      (document, index) => [
        { x: document.x + 22, y: document.y + 11 },
        { x: 149, y: document.y + 11 },
        { x: 157, y: 33 + index * 7 },
      ],
    );

    drawPixelText(context, "QUESTION", 7, 15, colors.faint);
    drawMessageCard(context, 5, 25, 43, 29, colors.faint);
    drawPixelText(context, "Q", 20, 32, colors.faint, 2);
    drawDatabase(context, 67, 19, 41, 43, colors.faint, "RAG");
    documentPositions.forEach((document) => {
      box(context, document.x, document.y, 22, 22, colors.faint);
    });
    withAlpha(context, activeAlpha, () => {
      withAlpha(context, query, () => {
        drawPixelText(context, "QUESTION", 7, 15, colors.blue);
        drawMessageCard(context, 5, 25, 43, 29, colors.blue);
        drawPixelText(context, "Q", 20, 32, colors.blue, 2);
      });
      progressivePath(context, queryPath, query, colors, 2);
      withAlpha(context, retrieve, () => {
        drawDatabase(context, 67, 19, 41, 43, colors.blue, "RAG");
      });
      documentPositions.forEach((document, index) => {
        const documentProgress = progressBetween(
          retrieve,
          index * 0.18,
          0.62 + index * 0.12,
        );
        progressivePath(
          context,
          documentPaths[index],
          documentProgress,
          colors,
          1,
        );
        withAlpha(context, documentProgress, () => {
          drawRankedDocument(
            context,
            document.x,
            document.y,
            index + 1,
            colors.blue,
          );
        });
      });
      if (answer > 0) {
        evidencePaths.forEach((path, index) => {
          progressivePath(
            context,
            path,
            progressBetween(answer, index * 0.14, 0.66 + index * 0.12),
            colors,
            1,
          );
        });
      }
      withAlpha(context, answer, () => {
        drawPixelText(context, "ANSWER", 163, 14, colors.blue);
        drawMessageCard(context, 158, 25, 46, 34, colors.blue);
        [0, 1, 2].forEach((row) => {
          const rowProgress = progressBetween(
            answer,
            row * 0.17,
            0.66 + row * 0.12,
          );
          if (!rowProgress) return;
          box(
            context,
            165,
            34 + row * 6,
            Math.round((30 - row * 5) * rowProgress),
            2,
            colors.blue,
            true,
          );
        });
      });
      withAlpha(context, progressBetween(answer, 0.7, 1), () => {
        drawCheck(context, 184, 52, colors.blue);
      });
    });
  },
};

const eventPoints: PixelPoint[] = Array.from({ length: 48 }, (_, index) => ({
  x: 10 + (index % 8) * 6,
  y: 19 + Math.floor(index / 8) * 8 + ((index * 3) % 3),
}));

const computeSpec: ExperienceSceneSpec = {
  durationFrames: 91,
  staticFrame: 76,
  phaseAt: (frame) => phaseAt(frame, 24, 52, 85),
  render: (context, frame, colors) => {
    const events = progressBetween(frame, 0, 23);
    const sketch = progressBetween(frame, 24, 51);
    const metric = progressBetween(frame, 52, 69);
    const activeAlpha = fadeAfter(frame, 85, 90);
    const registerHeights = [9, 18, 12, 25, 15, 22, 11];
    const compressionPaths: PixelPoint[][] = [
      [
        { x: 59, y: 26 },
        { x: 68, y: 26 },
        { x: 76, y: 30 },
        { x: 82, y: 30 },
      ],
      [
        { x: 59, y: 43 },
        { x: 70, y: 43 },
        { x: 76, y: 41 },
        { x: 82, y: 41 },
      ],
      [
        { x: 59, y: 61 },
        { x: 69, y: 61 },
        { x: 76, y: 53 },
        { x: 82, y: 53 },
      ],
    ];

    drawPixelText(context, "5B EVENTS", 9, 7, colors.faint);
    box(context, 6, 15, 53, 58, colors.faint);
    eventPoints.forEach((point) => {
      box(context, point.x, point.y, 2, 2, colors.faint, true);
    });
    drawRegisterBank(context, 82, 17, registerHeights, 0, colors.faint);
    withAlpha(context, activeAlpha, () => {
      drawPixelText(context, "5B EVENTS", 9, 7, colors.blue);
      eventPoints.forEach((point, index) => {
        const pointProgress = progressBetween(
          events,
          (index % 8) * 0.04,
          0.72 + (index % 6) * 0.03,
        );
        withAlpha(context, pointProgress, () => {
          box(context, point.x, point.y, 2, 2, colors.blue, true);
        });
      });
      compressionPaths.forEach((path, index) => {
        progressivePath(
          context,
          path,
          progressBetween(sketch, index * 0.12, 0.72 + index * 0.1),
          colors,
          2,
        );
      });
      withAlpha(context, sketch, () => {
        drawRegisterBank(
          context,
          82,
          17,
          registerHeights,
          sketch,
          colors.blue,
        );
      });
      if (metric > 0) {
        progressivePath(
          context,
          [
            { x: 134, y: 42 },
            { x: 142, y: 42 },
            { x: 147, y: 38 },
            { x: 151, y: 38 },
          ],
          metric,
          colors,
          2,
        );
      }
      withAlpha(context, metric, () => {
        drawMetricCard(
          context,
          151,
          19,
          53,
          "QUERY TIME",
          "-82%",
          colors.blue,
          metric,
        );
      });
    });
  },
};

const retentionSpec: ExperienceSceneSpec = {
  durationFrames: 93,
  staticFrame: 78,
  phaseAt: (frame) => phaseAt(frame, 25, 54, 87),
  render: (context, frame, colors) => {
    const customers = progressBetween(frame, 0, 24);
    const risk = progressBetween(frame, 25, 53);
    const retain = progressBetween(frame, 54, 71);
    const activeAlpha = fadeAfter(frame, 87, 92);
    const customerCards = [
      { x: 53, y: 13, label: "C1", score: 0.25 },
      { x: 91, y: 13, label: "C2", score: 0.52 },
      { x: 53, y: 46, label: "C3", score: 0.91 },
      { x: 91, y: 46, label: "C4", score: 0.41 },
    ];
    const sourcePaths: PixelPoint[][] = [
      [
        { x: 40, y: 20 },
        { x: 45, y: 20 },
        { x: 49, y: 26 },
        { x: 53, y: 26 },
      ],
      [
        { x: 40, y: 64 },
        { x: 45, y: 64 },
        { x: 49, y: 59 },
        { x: 53, y: 59 },
      ],
    ];

    drawSourceCard(context, 6, 12, "DB", colors.faint);
    drawSourceCard(context, 6, 56, "WEB", colors.faint);
    drawPixelText(context, "RISK SCORE", 64, 4, colors.faint);
    customerCards.forEach((customer) => {
      drawCustomerCard(
        context,
        customer.x,
        customer.y,
        customer.label,
        0,
        colors.faint,
      );
    });
    withAlpha(context, activeAlpha, () => {
      withAlpha(context, customers, () => {
        drawSourceCard(context, 6, 12, "DB", colors.blue);
        drawSourceCard(context, 6, 56, "WEB", colors.blue);
      });
      sourcePaths.forEach((path, index) => {
        progressivePath(
          context,
          path,
          progressBetween(customers, index * 0.14, 0.78 + index * 0.1),
          colors,
          2,
        );
      });
      customerCards.forEach((customer, index) => {
        const cardProgress = progressBetween(
          customers,
          index * 0.12,
          0.68 + index * 0.08,
        );
        withAlpha(context, cardProgress, () => {
          drawCustomerCard(
            context,
            customer.x,
            customer.y,
            customer.label,
            customer.score * risk,
            colors.blue,
            index === 2 && risk > 0.72,
          );
        });
      });
      if (retain > 0) {
        progressivePath(
          context,
          [
            { x: 87, y: 58 },
            { x: 89, y: 58 },
            { x: 89, y: 42 },
            { x: 135, y: 42 },
            { x: 143, y: 50 },
            { x: 149, y: 50 },
          ],
          retain,
          colors,
          2,
        );
      }
      withAlpha(context, retain, () => {
        drawMetricCard(
          context,
          149,
          19,
          55,
          "RETENTION",
          "+22%",
          colors.blue,
          retain,
        );
        withAlpha(context, progressBetween(retain, 0.65, 1), () => {
          drawPerson(context, 154, 49, colors.blue);
          drawCheck(context, 181, 55, colors.blue);
        });
      });
    });
  },
};

const forecastSpec: ExperienceSceneSpec = {
  durationFrames: 96,
  staticFrame: 82,
  phaseAt: (frame) => phaseAt(frame, 24, 56, 90),
  render: (context, frame, colors) => {
    const history = progressBetween(frame, 0, 23);
    const deploy = progressBetween(frame, 24, 55);
    const forecast = progressBetween(frame, 56, 75);
    const activeAlpha = fadeAfter(frame, 90, 95);
    const historyPoints = [
      { x: 9, y: 57 },
      { x: 18, y: 48 },
      { x: 28, y: 52 },
      { x: 39, y: 36 },
      { x: 49, y: 42 },
      { x: 61, y: 25 },
      { x: 69, y: 30 },
    ];
    const forecastPoints = [
      { x: 146, y: 54 },
      { x: 157, y: 48 },
      { x: 167, y: 42 },
      { x: 178, y: 32 },
      { x: 185, y: 29 },
      { x: 190, y: 27 },
    ];

    drawPixelText(context, "HISTORY", 9, 7, colors.faint);
    line(context, { x: 7, y: 62 }, { x: 72, y: 62 }, colors.faint);
    line(context, { x: 7, y: 62 }, { x: 7, y: 19 }, colors.faint);
    drawContainer(context, 84, 29, 34, 26, colors.faint);
    drawContainer(context, 121, 19, 20, 17, colors.faint);
    drawContainer(context, 121, 48, 20, 17, colors.faint);
    drawPixelText(context, "DEPLOY", 91, 65, colors.faint);
    withAlpha(context, activeAlpha, () => {
      withAlpha(context, history, () => {
        drawPixelText(context, "HISTORY", 9, 7, colors.blue);
      });
      progressivePolyline(context, historyPoints, history, colors, 2);
      progressivePath(
        context,
        [
          { x: 69, y: 30 },
          { x: 76, y: 30 },
          { x: 82, y: 37 },
          { x: 84, y: 37 },
        ],
        deploy,
        colors,
        2,
      );
      withAlpha(context, deploy, () => {
        drawContainer(context, 84, 29, 34, 26, colors.blue);
        drawPixelText(context, "DEPLOY", 91, 65, colors.blue);
      });
      const clusterProgress = progressBetween(deploy, 0.42, 1);
      withAlpha(context, clusterProgress, () => {
        drawContainer(context, 121, 19, 20, 17, colors.blue);
        drawContainer(context, 121, 48, 20, 17, colors.blue);
      });
      progressivePath(
        context,
        [
          { x: 118, y: 42 },
          { x: 128, y: 42 },
          { x: 137, y: 49 },
          { x: 146, y: 54 },
        ],
        clusterProgress,
        colors,
        2,
      );
      withAlpha(context, forecast, () => {
        drawPixelText(context, "FORECAST", 151, 7, colors.blue);
      });
      if (forecast > 0) {
        progressiveDashedPath(
          context,
          forecastPoints,
          forecast,
          colors,
        );
      }
      withAlpha(context, forecast, () => {
        drawTarget(context, 190, 27, colors.blue);
      });
      withAlpha(context, progressBetween(forecast, 0.55, 1), () => {
        drawTextChip(context, 151, 66, "67% FASTER", colors.blue);
      });
    });
  },
};

const auditSpec: ExperienceSceneSpec = {
  durationFrames: 95,
  staticFrame: 80,
  phaseAt: (frame) => phaseAt(frame, 24, 55, 89),
  render: (context, frame, colors) => {
    const models = progressBetween(frame, 0, 23);
    const compare = progressBetween(frame, 24, 54);
    const verified = progressBetween(frame, 55, 73);
    const activeAlpha = fadeAfter(frame, 89, 94);
    const radarValues = [20, 31, 18, 27, 23];
    const rValues = [20, 31, 11, 27, 23];
    const rowYs = [32, 40, 48, 56, 64];

    drawComparisonMatrix(
      context,
      5,
      13,
      "RADAR",
      radarValues,
      colors.faint,
      0,
    );
    drawComparisonMatrix(
      context,
      133,
      13,
      "R",
      rValues,
      colors.faint,
      0,
    );
    box(context, 91, 29, 28, 26, colors.faint);
    drawPixelText(context, "SCAN", 97, 40, colors.faint);

    withAlpha(context, activeAlpha, () => {
      withAlpha(context, models, () => {
        drawComparisonMatrix(
          context,
          5,
          13,
          "RADAR",
          radarValues,
          colors.blue,
          models,
        );
        drawComparisonMatrix(
          context,
          133,
          13,
          "R",
          rValues,
          colors.blue,
          models,
        );
      });
      progressivePath(
        context,
        [
          { x: 78, y: 42 },
          { x: 90, y: 42 },
        ],
        compare,
        colors,
      );
      progressivePath(
        context,
        [
          { x: 132, y: 42 },
          { x: 120, y: 42 },
        ],
        compare,
        colors,
      );
      if (compare > 0 && verified === 0) {
        const activeRow = Math.min(4, Math.floor(compare * 5));
        rowYs.forEach((rowY, index) => {
          if (index > activeRow) return;
          drawPixelText(
            context,
            index === 2 ? "DIFF" : "OK",
            index === 2 ? 97 : 101,
            rowY - 2,
            colors.blue,
          );
        });
      }
      if (verified > 0) {
        const reconciled = Math.round(
          rValues[2] + (radarValues[2] - rValues[2]) * verified,
        );
        box(context, 147, rowYs[2] - 1, reconciled, 3, colors.blue, true);
        withAlpha(context, progressBetween(verified, 0.42, 1), () => {
          box(context, 91, 29, 28, 26, colors.blue, false, 2);
          drawPixelText(context, "MATCH", 95, 34, colors.blue);
          drawCheck(context, 99, 45, colors.blue);
        });
      }
    });
  },
};

export const experienceSceneSpecs: Record<
  ExperienceSceneName,
  ExperienceSceneSpec
> = {
  automation: automationSpec,
  audit: auditSpec,
  compute: computeSpec,
  forecast: forecastSpec,
  growth: growthSpec,
  rag: ragSpec,
  retention: retentionSpec,
};
