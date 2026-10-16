// Smart Context-Aware Quiz & Flashcard Extraction Engine
// Extracts real human-authored Q&As, Markdown Tables, Callout Gotchas, and Bold Definitions

export const SmartQuizEngine = {
  /**
   * Parse details summary and Q / A blocks
   */
  extractExplicitQA(content, note) {
    const questions = [];
    if (!content) return questions;

    // Pattern 1: <details><summary>Question</summary>Answer</details>
    const detailsRegex = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
    let match;
    while ((match = detailsRegex.exec(content)) !== null) {
      const qText = match[1].replace(/<[^>]+>/g, '').trim();
      const aText = match[2].replace(/<[^>]+>/g, '').trim();

      if (qText.length > 5 && aText.length > 5) {
        questions.push({
          type: 'explicit_details',
          question: qText.replace(/^(Q\d*[:.]\s*|Question\s*:\s*)/i, '').trim(),
          answer: aText.replace(/^(A\d*[:.]\s*|Answer\s*:\s*)/i, '').trim(),
          sourceNoteTitle: note.title,
          sourceNoteId: note.id,
          priority: 1
        });
      }
    }

    // Pattern 2: **Q:** / **Question:** followed by **A:** / **Answer:**
    const qaRegex = /\*\*(?:Q\d*|Question)\s*[:.]\*\*\s*([^\n]+)\n+\*\*(?:A\d*|Answer)\s*[:.]\*\*\s*([^\n]+)/gi;
    while ((match = qaRegex.exec(content)) !== null) {
      const qText = match[1].trim();
      const aText = match[2].trim();
      if (qText.length > 5 && aText.length > 5) {
        questions.push({
          type: 'explicit_qa',
          question: qText,
          answer: aText,
          sourceNoteTitle: note.title,
          sourceNoteId: note.id,
          priority: 1
        });
      }
    }

    return questions;
  },

  /**
   * Parse Markdown Tables into direct functional questions with table-based distractors
   */
  extractTableQuestions(content, note) {
    const questions = [];
    if (!content) return questions;

    // Split markdown into potential table blocks
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];

    const processTable = (rows) => {
      if (rows.length < 3) return; // Need header + separator + at least 1 row
      const headers = rows[0].split('|').map((c) => c.trim()).filter(Boolean);
      if (headers.length < 2) return;

      const dataRows = [];
      for (let i = 2; i < rows.length; i++) {
        const cols = rows[i].split('|').map((c) => c.trim()).filter(Boolean);
        if (cols.length >= 2) {
          dataRows.push(cols);
        }
      }

      if (dataRows.length < 2) return;

      // Generate a question for each row in the table
      dataRows.forEach((row, rowIdx) => {
        const col0 = row[0].replace(/[`*]/g, '').trim();
        const col1 = row[1].replace(/[`*]/g, '').trim();

        if (col0.length >= 2 && col1.length >= 5) {
          // Collect plausible distractors from the other rows of the exact same table!
          const otherCol0s = dataRows
            .filter((_, idx) => idx !== rowIdx)
            .map((r) => r[0].replace(/[`*]/g, '').trim());

          const otherCol1s = dataRows
            .filter((_, idx) => idx !== rowIdx)
            .map((r) => r[1].replace(/[`*]/g, '').trim());

          // Question Type A: "Which [Header 0] is described as: '[Col 1]'?"
          questions.push({
            type: 'table_match',
            question: `In "${note.title}", which ${headers[0] || 'item'} is defined as: "${col1}"?`,
            answer: col0,
            distractors: otherCol0s.slice(0, 3),
            explanation: `From the comparison table in "${note.title}": ${col0} corresponds to "${col1}".`,
            sourceNoteTitle: note.title,
            sourceNoteId: note.id,
            difficulty: 'Medium',
            priority: 2
          });

          // Question Type B: "What is the [Header 1] of '[Col 0]'?"
          if (otherCol1s.length >= 2) {
            questions.push({
              type: 'table_function',
              question: `According to "${note.title}", what is the ${headers[1] || 'property'} of "${col0}"?`,
              answer: col1,
              distractors: otherCol1s.slice(0, 3),
              explanation: `From "${note.title}": ${col0} has ${headers[1] || 'property'}: "${col1}".`,
              sourceNoteTitle: note.title,
              sourceNoteId: note.id,
              difficulty: 'Medium',
              priority: 2
            });
          }
        }
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        tableRows.push(line);
      } else {
        if (inTable && tableRows.length >= 3) {
          processTable(tableRows);
        }
        inTable = false;
        tableRows = [];
      }
    }
    if (inTable && tableRows.length >= 3) {
      processTable(tableRows);
    }

    return questions;
  },

  /**
   * Parse Callout Boxes (> [!WARNING], > [!TIP], > ⚠️ Gotcha:)
   */
  extractCalloutQuestions(content, note) {
    const questions = [];
    if (!content) return questions;

    const calloutRegex = />\s*(?:\[!(?:WARNING|CAUTION|TIP|NOTE|IMPORTANT)\]|(?:⚠️\s*Gotcha|💡\s*Tip|🎯\s*Interview Tip|⚡\s*Key Insight))[:\-–]?\s*([^\n]+)/gi;
    let match;

    while ((match = calloutRegex.exec(content)) !== null) {
      const calloutText = match[1].replace(/[#*`_>]/g, '').trim();
      if (calloutText.length > 20 && calloutText.length < 260) {
        questions.push({
          type: 'callout_insight',
          question: `Which critical gotcha / best-practice is emphasized for "${note.title}"?`,
          answer: calloutText,
          distractors: [
            'Bypasses all latency checks automatically when CPU exceeds maximum threshold',
            'Enforces synchronous blocking locks across all read-only distributed replicas',
            'Disables automated memory garbage collection during peak concurrent traffic'
          ],
          explanation: `Highlighted as an essential tip/gotcha in "${note.title}": "${calloutText}"`,
          sourceNoteTitle: note.title,
          sourceNoteId: note.id,
          difficulty: 'Hard',
          priority: 3
        });
      }
    }

    return questions;
  },

  /**
   * Parse Bold Definitions: "- **Term**: Complete Explanation"
   */
  extractDefinitionQuestions(content, note) {
    const questions = [];
    if (!content) return questions;

    const lines = content.split('\n');
    let currentHeading = note.title;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        currentHeading = line.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim();
        continue;
      }

      // Check for bullet bold definition
      const boldMatch = line.match(/^[-*]\s*\*\*([A-Za-z0-9_\-\s]{2,35})\*\*[:\-–—]\s*(.{25,300})/);
      if (boldMatch) {
        const term = boldMatch[1].trim();
        const def = boldMatch[2].replace(/[*_`]/g, '').trim();

        // Ensure term is an actual keyword (not a whole sentence)
        if (term.split(/\s+/).length <= 4) {
          questions.push({
            type: 'bold_definition',
            term,
            definition: def,
            topic: currentHeading,
            sourceNoteTitle: note.title,
            sourceNoteId: note.id,
            difficulty: 'Easy',
            priority: 4
          });
        }
      }
    }

    return questions;
  },

  /**
   * Generate Flashcards with Spaced Repetition Ratings
   */
  generateFlashcards(note) {
    if (!note || !note.content) return [];

    const flashcards = [];

    // 1. Explicit Q&A
    const explicitQAs = this.extractExplicitQA(note.content, note);
    explicitQAs.forEach((item) => {
      flashcards.push({
        id: `fc_exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        front: item.question,
        back: item.answer,
        badge: 'INTERVIEW Q&A',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        sourceTitle: note.title,
        noteId: note.id
      });
    });

    // 2. Table-based Flashcards
    const tableQs = this.extractTableQuestions(note.content, note);
    tableQs.forEach((item) => {
      flashcards.push({
        id: `fc_tbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        front: item.question,
        back: `${item.answer}\n\n💡 ${item.explanation}`,
        badge: 'TABLE INSIGHT',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        sourceTitle: note.title,
        noteId: note.id
      });
    });

    // 3. Callout Gotchas & Tips
    const callouts = this.extractCalloutQuestions(note.content, note);
    callouts.forEach((item) => {
      flashcards.push({
        id: `fc_cal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        front: item.question,
        back: `⚠️ ${item.answer}`,
        badge: 'GOTCHA / TIP',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        sourceTitle: note.title,
        noteId: note.id
      });
    });

    // 4. Bold Definitions
    const definitions = this.extractDefinitionQuestions(note.content, note);
    definitions.forEach((item) => {
      flashcards.push({
        id: `fc_def_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        front: `What is "${item.term}" in ${item.topic}?`,
        back: item.definition,
        badge: 'CORE CONCEPT',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        sourceTitle: note.title,
        noteId: note.id
      });
    });

    // 5. Fallback: H2 Section summaries if note has no special markup
    if (flashcards.length === 0) {
      if (note.summary) {
        flashcards.push({
          id: `fc_sum_${Date.now()}`,
          front: `Core summary of "${note.title}"`,
          back: note.summary,
          badge: 'OVERVIEW',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          sourceTitle: note.title,
          noteId: note.id
        });
      }

      const h2Sections = note.content.split(/\n(?=##\s+)/);
      h2Sections.forEach((sec) => {
        const match = sec.match(/^##\s+(.+)\r?\n([\s\S]+)$/);
        if (match) {
          const heading = match[1].replace(/[*_`]/g, '').trim();
          const body = match[2].slice(0, 260).replace(/[#*`_>]/g, '').trim();
          if (heading && body.length > 20) {
            flashcards.push({
              id: `fc_sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              front: `What are the key points of "${heading}"?`,
              back: body + '...',
              badge: 'SECTION RECAP',
              badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
              sourceTitle: note.title,
              noteId: note.id
            });
          }
        }
      });
    }

    return flashcards;
  },

  /**
   * Generate Smart Multi-Note Quiz MCQs
   */
  generateSmartQuiz(notes, options = {}) {
    if (!notes || notes.length === 0) return [];

    const requestedCount = Math.max(3, Math.min(options.questionCount || 5, 50));
    const difficultyFilter = options.difficulty || 'all';

    const allCandidateQuestions = [];
    const allKnownTerms = [];
    const allKnownDefinitions = [];

    // Collect all elements across all selected notes
    for (const note of notes) {
      // 1. Explicit Q&A
      const explicit = this.extractExplicitQA(note.content, note);
      explicit.forEach((item) => {
        allCandidateQuestions.push({
          type: 'explicit',
          question: item.question,
          answer: item.answer,
          explanation: `Direct interview challenge from "${note.title}".`,
          sourceNoteTitle: note.title,
          sourceNoteId: note.id,
          difficulty: 'Medium',
          priority: 1
        });
      });

      // 2. Table-based Questions
      const tables = this.extractTableQuestions(note.content, note);
      allCandidateQuestions.push(...tables);

      // 3. Callout Boxes
      const callouts = this.extractCalloutQuestions(note.content, note);
      allCandidateQuestions.push(...callouts);

      // 4. Bold Definitions
      const defs = this.extractDefinitionQuestions(note.content, note);
      defs.forEach((d) => {
        allKnownTerms.push(d.term);
        allKnownDefinitions.push(d.definition);

        allCandidateQuestions.push({
          type: 'definition_question',
          question: `In "${d.topic || note.title}", which of the following is defined as: "${d.definition}"?`,
          answer: d.term,
          isTermAnswer: true,
          explanation: `In note "${note.title}", ${d.term} is defined as: ${d.definition}`,
          sourceNoteTitle: note.title,
          sourceNoteId: note.id,
          difficulty: d.difficulty || 'Easy',
          priority: 4
        });
      });
    }

    // Distractor helpers
    const fallbackTechnicalTerms = [
      'Consistent Hashing Ring',
      'Two-Phase Commit (2PC)',
      'LRU Cache Eviction Policy',
      'Eventual Consistency Protocol',
      'Read-Copy-Update (RCU)',
      'Exponential Backoff Jitter',
      'Idempotency Token'
    ];

    const fallbackDefinitions = [
      'Coordinates distributed consensus by electing a quorum leader with majority voting',
      'Maintains sequential access consistency across partition boundaries without deadlock',
      'Caches intermediate results in volatile RAM using high-throughput memory mapping',
      'Bypasses CPU interrupts by polling high-speed network device ring buffers directly'
    ];

    const finalQuestions = [];

    // Sort by priority (Explicit QA -> Tables -> Callouts -> Definitions)
    allCandidateQuestions.sort((a, b) => (a.priority || 5) - (b.priority || 5));

    for (const item of allCandidateQuestions) {
      if (finalQuestions.length >= requestedCount) break;

      // Filter by difficulty if specified
      if (
        difficultyFilter !== 'all' &&
        item.difficulty &&
        item.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()
      ) {
        continue;
      }

      // Build 3 distractors
      const distractors = [];

      if (item.distractors && item.distractors.length >= 2) {
        distractors.push(...item.distractors.slice(0, 3));
      } else if (item.isTermAnswer) {
        // Collect fake terms
        const otherTerms = allKnownTerms.filter((t) => t !== item.answer);
        for (const t of otherTerms) {
          if (!distractors.includes(t)) {
            distractors.push(t);
            if (distractors.length >= 3) break;
          }
        }
        let fIdx = 0;
        while (distractors.length < 3) {
          const fake = fallbackTechnicalTerms[fIdx % fallbackTechnicalTerms.length];
          if (!distractors.includes(fake) && fake !== item.answer) {
            distractors.push(fake);
          }
          fIdx++;
        }
      } else {
        // Collect fake definitions
        const otherDefs = allKnownDefinitions.filter((d) => d !== item.answer);
        for (const d of otherDefs) {
          if (!distractors.includes(d)) {
            distractors.push(d);
            if (distractors.length >= 3) break;
          }
        }
        let fIdx = 0;
        while (distractors.length < 3) {
          const fake = fallbackDefinitions[fIdx % fallbackDefinitions.length];
          if (!distractors.includes(fake) && fake !== item.answer) {
            distractors.push(fake);
          }
          fIdx++;
        }
      }

      // Shuffle options
      const rawOptions = [item.answer, ...distractors.slice(0, 3)];
      const shuffledOptions = rawOptions
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value);

      const correctIndex = shuffledOptions.indexOf(item.answer);

      finalQuestions.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        question: item.question,
        options: shuffledOptions,
        correctIndex,
        explanation: item.explanation || `Correct answer is: ${item.answer}`,
        sourceNoteTitle: item.sourceNoteTitle,
        sourceNoteId: item.sourceNoteId,
        difficulty: item.difficulty || 'Medium'
      });
    }

    return finalQuestions.slice(0, requestedCount);
  }
};
