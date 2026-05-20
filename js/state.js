export const CONSTANTS = {
    TEST_DURATION: 100 * 60,
    PASS_TWK: 65,
    PASS_TIU: 80,
    PASS_TKP: 166
};

export const state = {
    questions: [],
    currentIdx: 0,
    userAnswers: {},
    markedQuestions: new Set(),
    timerInterval: null,
    currentPackagePath: ""
};
