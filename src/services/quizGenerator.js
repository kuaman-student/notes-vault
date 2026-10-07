// Quiz Generation Engine for NexusNotes
// Generates intelligent, multi-choice questions from single or multiple Markdown notes

function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, '') // remove code blocks for text parsing
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // unwrap links
    .replace(/[#*`_>]/g, '') // remove markdown symbols
    .trim();
}

// Extract key sentences and definitions from note content
function extractKnowledgePoints(note) {
  const points = [];
  const content = note.content || '';
  const lines = content.split('\n');

  let currentHeading = note.title;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Track headings
    if (rawLine.startsWith('#')) {
      currentHeading = rawLine.replace(/^#+\s*/, '').trim();
      continue;
    }

    // Pattern 1: Bold definition "- **Term**: Description" or "**Term** - Description"
    const boldColonMatch = rawLine.match(/\*\*([^*]+)\*\*[:\-–—]\s*(.+)/);
    if (boldColonMatch) {
      const term = boldColonMatch[1].trim();
      const def = boldColonMatch[2].trim();
      if (term.length > 2 && def.length > 15) {
        points.push({
          type: 'definition',
          term,
          definition: def,
          topic: currentHeading,
          sourceTitle: note.title,
          sourceId: note.id
        });
      }
      continue;
    }

    // Pattern 2: "Term is / refers to / represents / provides / enables"
    const isMatch = rawLine.match(/([A-Z][a-zA-Z0-9\s\-]{2,30})\s+(is a|is an|is the|is used to|refers to|represents|provides|enables|handles|ensures)\s+([^.!?]+[.!?])/);
    if (isMatch) {
      const term = isMatch[1].trim();
      const verb = isMatch[2];
      const desc = isMatch[3].trim();
      if (term.length > 2 && desc.length > 15) {
        points.push({
          type: 'is_statement',
          term,
          definition: `${verb} ${desc}`,
          topic: currentHeading,
          sourceTitle: note.title,
          sourceId: note.id
        });
      }
      continue;
    }

    // Pattern 3: Bullet points with solid substance
    if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      const bulletText = rawLine.replace(/^[-*]\s*/, '').trim();
      if (bulletText.length > 25 && bulletText.length < 250) {
        points.push({
          type: 'fact',
          text: bulletText,
          topic: currentHeading,
          sourceTitle: note.title,
          sourceId: note.id
        });
      }
    }
  }

  // Also collect code blocks if any
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let codeMatch;
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const lang = codeMatch[1] || 'code';
    const codeSnippet = codeMatch[2].trim();
    if (codeSnippet.length > 15 && codeSnippet.length < 350) {
      points.push({
        type: 'code',
        lang,
        code: codeSnippet,
        topic: currentHeading,
        sourceTitle: note.title,
        sourceId: note.id
      });
    }
  }

  return points;
}

// Generate distractor choices using other terms/definitions from other points
function generateDistractors(correctItem, allPoints, type) {
  const distractors = [];

  // Filter pool for different items
  const candidates = allPoints.filter(
    (p) => p !== correctItem && (p.term || p.definition || p.text)
  );

  // Shuffle candidates
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());

  if (type === 'term') {
    // We want 3 fake definitions/descriptions
    for (const c of shuffled) {
      const val = c.definition || c.text;
      if (val && !distractors.includes(val) && val !== correctItem.definition) {
        distractors.push(val);
        if (distractors.length >= 3) break;
      }
    }
  } else if (type === 'which_term') {
    // We want 3 fake term names
    for (const c of shuffled) {
      const val = c.term || c.topic;
      if (val && !distractors.includes(val) && val !== correctItem.term) {
        distractors.push(val);
        if (distractors.length >= 3) break;
      }
    }
  }

  // If not enough distractors found, provide intelligent fallback distractors
  const genericConceptDistractors = [
    'Maintains thread safety by enforcing an exclusive lock on all shared memory locations',
    'Increases network latency by re-routing all packet headers through a centralized master replica',
    'Eliminates disk I/O bottlenecks by converting write operations into temporary cache misses',
    'Restricts execution privileges to root-level namespaces without checking kernel credentials',
    'Decreases memory consumption by swapping dirty memory pages directly into cold storage',
    'Automatically bypasses encryption layers when bandwidth reaches threshold limits'
  ];

  const genericTermDistractors = [
    'Exponential Backoff',
    'Idempotency Key',
    'Deadlock Prevention Algorithm',
    'Dynamic Partitioning',
    'LRU Cache Eviction',
    'Two-Phase Commit',
    'Consistent Hashing'
  ];

  let fallbackIdx = 0;
  while (distractors.length < 3) {
    const fallback =
      type === 'which_term'
        ? genericTermDistractors[fallbackIdx % genericTermDistractors.length]
        : genericConceptDistractors[fallbackIdx % genericConceptDistractors.length];
    if (!distractors.includes(fallback) && fallback !== correctItem.term && fallback !== correctItem.definition) {
      distractors.push(fallback);
    }
    fallbackIdx++;
  }

  return distractors.slice(0, 3);
}

export const QuizGenerator = {
  /**
   * Generates a multi-note quiz from selected notes
   * @param {Array} notes - Array of Note objects
   * @param {Object} options - { questionCount: number, difficulty: string }
   * @returns {Array} Array of Question objects
   */
  generateQuiz(notes, options = {}) {
    if (!notes || notes.length === 0) return [];

    const questionCount = Math.max(3, Math.min(options.questionCount || 5, 50));
    const difficultySetting = options.difficulty || 'all'; // 'all', 'easy', 'medium', 'hard'

    // 1. Gather all knowledge points across all selected notes
    const allKnowledgePoints = [];
    const notesKnowledgeMap = new Map();

    notes.forEach((note) => {
      const points = extractKnowledgePoints(note);
      notesKnowledgeMap.set(note.id, points);
      allKnowledgePoints.push(...points);
    });

    const generatedQuestions = [];

    // Helper: Build a question object
    const buildQuestion = (qText, correctOption, distractors, explanation, sourceTitle, sourceId, diff) => {
      const options = [correctOption, ...distractors];
      // Shuffle options and remember correct index
      const shuffledOptions = options
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value);

      const correctIndex = shuffledOptions.indexOf(correctOption);

      return {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        question: qText,
        options: shuffledOptions,
        correctIndex,
        explanation,
        sourceNoteTitle: sourceTitle,
        sourceNoteId: sourceId,
        difficulty: diff || 'Medium'
      };
    };

    // 2. Iterate and generate questions proportionally across notes
    const availablePoints = [...allKnowledgePoints].sort(() => 0.5 - Math.random());

    for (const point of availablePoints) {
      if (generatedQuestions.length >= questionCount) break;

      if (point.type === 'definition' || point.type === 'is_statement') {
        const rand = Math.random();

        if (rand > 0.5) {
          // Question Style A: "What is the primary function / definition of [Term]?"
          const qText = `In the context of "${point.topic || point.sourceTitle}", which of the following best describes "${point.term}"?`;
          const correctOption = point.definition;
          const distractors = generateDistractors(point, allKnowledgePoints, 'term');
          const explanation = `According to note "${point.sourceTitle}", ${point.term} ${point.definition}.`;

          generatedQuestions.push(
            buildQuestion(qText, correctOption, distractors, explanation, point.sourceTitle, point.sourceId, 'Easy')
          );
        } else {
          // Question Style B: "Which term describes [Definition]?"
          const qText = `Which concept in "${point.topic || point.sourceTitle}" is defined as: "${point.definition}"?`;
          const correctOption = point.term;
          const distractors = generateDistractors(point, allKnowledgePoints, 'which_term');
          const explanation = `"${point.term}" directly corresponds to this description in your note "${point.sourceTitle}".`;

          generatedQuestions.push(
            buildQuestion(qText, correctOption, distractors, explanation, point.sourceTitle, point.sourceId, 'Medium')
          );
        }
      } else if (point.type === 'fact' && generatedQuestions.length < questionCount) {
        // Question Style C: Fact evaluation
        const qText = `Based on your study notes on "${point.sourceTitle}", which of the following statements is TRUE regarding "${point.topic}"?`;
        const correctOption = point.text;
        const distractors = generateDistractors(point, allKnowledgePoints, 'term');
        const explanation = `Highlighted in note "${point.sourceTitle}": ${point.text}`;

        generatedQuestions.push(
          buildQuestion(qText, correctOption, distractors, explanation, point.sourceTitle, point.sourceId, 'Hard')
        );
      } else if (point.type === 'code' && generatedQuestions.length < questionCount) {
        // Question Style D: Code logic / syntax recognition
        const qText = `Consider the following snippet from "${point.sourceTitle}":\n\`\`\`${point.lang}\n${point.code.slice(0, 150)}${point.code.length > 150 ? '...' : ''}\n\`\`\`\nWhat core engineering concept does this implement?`;
        const correctOption = point.topic || point.sourceTitle;
        const distractors = generateDistractors(point, allKnowledgePoints, 'which_term');
        const explanation = `This snippet is documented under "${point.topic}" in "${point.sourceTitle}".`;

        generatedQuestions.push(
          buildQuestion(qText, correctOption, distractors, explanation, point.sourceTitle, point.sourceId, 'Hard')
        );
      }
    }

    // 3. Fallback: If note content was too concise to produce enough questions from specific patterns,
    // construct comprehensive conceptual questions from the note titles & content headings
    if (generatedQuestions.length < questionCount) {
      for (const note of notes) {
        if (generatedQuestions.length >= questionCount) break;

        const cleanBody = cleanMarkdown(note.content);
        const sentences = cleanBody.split(/(?<=[.!?])\s+/).filter((s) => s.length > 25);
        if (sentences.length > 0) {
          const keySentence = sentences[Math.floor(Math.random() * sentences.length)];
          const qText = `Regarding the architecture and key insights of "${note.title}", which of the following principles is emphasized?`;
          const correctOption = keySentence;
          const distractors = generateDistractors(
            { definition: keySentence, term: note.title },
            allKnowledgePoints,
            'term'
          );
          const explanation = `From "${note.title}": "${keySentence}"`;

          generatedQuestions.push(
            buildQuestion(qText, correctOption, distractors, explanation, note.title, note.id, 'Medium')
          );
        }
      }
    }

    // 4. Filter by difficulty if requested
    if (difficultySetting !== 'all') {
      const filtered = generatedQuestions.filter(
        (q) => q.difficulty.toLowerCase() === difficultySetting.toLowerCase()
      );
      if (filtered.length >= 3) {
        return filtered.slice(0, questionCount);
      }
    }

    return generatedQuestions.slice(0, questionCount);
  }
};
