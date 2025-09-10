// bodyタグのdata-page属性値に一致するjsonファイルを/assets/json/から読み込む
document.addEventListener('DOMContentLoaded', () => {
	const body = document.body;
	const page = body.getAttribute('data-page');
	if (!page) return;
	const jsonPath = `/assets/json/${page}.json`;
		fetch(jsonPath)
			.then(res => {
				if (!res.ok) throw new Error('JSONファイルの取得に失敗しました');
				return res.json();
			})
			.then(data => {
				if (!Array.isArray(data) || data.length === 0) return;
				const quiz = data[0];
				// talkを.quiz_question_textに反映
				const questionText = document.querySelector('.quiz_question_text');
				if (questionText && quiz.talk) {
					questionText.textContent = quiz.talk;
				}
				// idをimgのsrcの{quiz_id}に反映
				const img = document.querySelector('.quiz_question_image img');
				if (img && quiz.id) {
					img.src = img.src.replace('quiz_id', quiz.id);
				}

				// talkAnswerを.quiz_answer_listにmapで表示
				const answerList = document.querySelector('.quiz_answer_list');
				if (answerList && Array.isArray(quiz.talkAnswer)) {
					answerList.innerHTML = quiz.talkAnswer.map((answer, idx) =>
						`<li class="quiz_answer_item" data-answer="${idx + 1}"><button>${answer}</button></li>`
					).join('');
				}

				// 選択状態管理用
				let selectedIdx = null;
				answerList.addEventListener('click', (e) => {
					const li = e.target.closest('.quiz_answer_item');
					if (!li) return;
					// 選択状態を切り替え
					answerList.querySelectorAll('.quiz_answer_item').forEach(item => item.classList.remove('selected'));
					li.classList.add('selected');
					selectedIdx = parseInt(li.getAttribute('data-answer'), 10) - 1;
					// quiz_next_buttonにクラス付与
					const nextBtn = document.querySelector('.quiz_next_button');
					if (nextBtn) {
						nextBtn.classList.add('active');
					}
				});

				// 次へボタンでquiz/quizChoice反映
				const nextBtn = document.querySelector('.quiz_next_button');
				if (nextBtn) {
					let isQuizPhase = false;
					nextBtn.addEventListener('click', () => {
						if (selectedIdx === null) return;
						// talkとtalkAnswerが表示されているときはアラートを出さず、quiz/quizChoice表示に切り替えるだけ
						if (!isQuizPhase) {
							// quiz内n番目のテキストとquizTextを.quiz_question_textに
							if (Array.isArray(quiz.quiz) && quiz.quiz[selectedIdx]) {
								let text = quiz.quiz[selectedIdx];
								if (quiz.quizText) {
									text += '\n' + quiz.quizText;
								}
								questionText.innerHTML = text;
							}
							// quizChoiceの値をbuttonに
							if (Array.isArray(quiz.quizChoice)) {
								const btns = answerList.querySelectorAll('button');
								btns.forEach((btn, idx) => {
									btn.textContent = quiz.quizChoice[idx] || '';
								});
							}
							// quiz_next_buttonのテキストを「答える」に変更
							nextBtn.innerHTML = '答える';
							isQuizPhase = true;
							// 選択状態リセット
							answerList.querySelectorAll('.quiz_answer_item').forEach(item => item.classList.remove('selected'));
							selectedIdx = null;
							// quiz_next_buttonのクラス削除
							nextBtn.classList.remove('active');
							return;
						}
						// 2回目以降（quizChoice表示時）は正誤判定
						setTimeout(() => {
							const selectedLi = answerList.querySelector('.quiz_answer_item.selected');
							if (selectedLi && quiz.quizAnswer) {
								const selectedAnswer = parseInt(selectedLi.getAttribute('data-answer'), 10);
								const quizId = quiz.id;
								if (selectedAnswer === quiz.quizAnswer) {
									window.location.href = `/quiz/${quizId}/correct.html`;
								} else {
									window.location.href = `/quiz/${quizId}/incorrect.html`;
								}
							}
							// 選択状態リセット
							answerList.querySelectorAll('.quiz_answer_item').forEach(item => item.classList.remove('selected'));
							selectedIdx = null;
							// quiz_next_buttonのクラス削除
							nextBtn.classList.remove('active');
						}, 0);
					});
				}
			})
			.catch(err => {
				console.error('JSON読み込みエラー:', err);
			});
});
