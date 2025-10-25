// Global variables for the guessing game
let targetNumber = Math.floor(Math.random() * 100) + 1;
let guessCount = 0;
let minRange = 1;
let maxRange = 100;

// Load markdown content on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMarkdownContent();
    initializeQuizzes();
    initSVGInteractions();
    document.getElementById('current-year').textContent = new Date().getFullYear();
});

// Function to load and render markdown content
async function loadMarkdownContent() {
    try {
        const response = await fetch('understanding_computational_thinking.md');
        if (!response.ok) {
            throw new Error('Failed to load content');
        }
        
        const text = await response.text();
        
        const yamlEndIndex = text.indexOf('---', 3);
        let markdownContent = text;
        let metadata = {};
        
        if (text.startsWith('---') && yamlEndIndex !== -1) {
            const yamlString = text.substring(4, yamlEndIndex);
            markdownContent = text.substring(yamlEndIndex + 3);
            try {
                metadata = jsyaml.load(yamlString) || {};
            } catch (yamlError) {
                console.warn('Failed to parse YAML front matter:', yamlError);
            }
        }
        
        const htmlContent = marked.parse(markdownContent);
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.innerHTML = htmlContent;
        }
        
    } catch (error) {
        console.error('Error loading markdown content:', error);
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            // 提供备用内容，确保远程部署时也能显示内容
            contentContainer.innerHTML = `
                <h1>理解计算思维：像计算机科学家一样思考问题</h1>

                <p>同学们，欢迎来到一个充满奇妙可能的世界——计算机科学、人工智能和互联网！你们有没有想过，为什么计算机能下围棋打败世界冠军？为什么搜索引擎能瞬间找到你想要的信息？又或者，编写代码是怎么让机器听懂我们"指令"的？这一切的背后，都藏着一种强大而有趣的"超能力"，它被称为<strong>计算思维</strong>。</p>

                <p>计算思维可不是让你的脑袋变成一台计算机，也不是只会编程那么简单。它是指我们<strong>运用计算机科学家解决问题的基本方法和理念来分析和解决现实世界中的各种问题</strong>。简而言之，就是学会像计算机科学家一样去思考！</p>

                <p>美国卡内基·梅隆大学的 Jeannette M. Wing 教授在 2006 年首次提出计算思维的概念时，就强调它是面向未来的基础能力。掌握它，不仅能帮你更好地理解计算机、编程、AI 和互联网技术，还能让你在面对任何复杂挑战时，都能找到更高效、更有条理的解决路径。</p>

                <blockquote>
                    <p>计算思维是一种运用计算机科学的基础概念去求解问题、设计系统和理解人类行为的方法。—— Jeannette M. Wing</p>
                </blockquote>

                <p>计算思维的核心可以概括为两个关键词：<strong>抽象 (Abstraction)</strong> 和 <strong>自动化 (Automation)</strong>。抽象帮助我们抓住问题的本质，忽略不重要的细节；自动化则是通过设计一系列清晰的步骤，让问题能够被系统性地解决。</p>

                <h2>计算思维：不仅仅是编程技能</h2>

                <p>同学们可能会觉得，这些概念听起来有点像编程。没错，<strong>学习编程是培养计算思维非常有效的一种方式</strong>，因为编程的过程天然就要求你进行问题分解、抽象和算法设计。</p>

                <p>但计算思维的能力远不止于此。它是一种<strong>普适性的问题解决能力</strong>。无论你是想设计一个更合理的班级座位表、规划一个最高效的周末活动路线、分析社交媒体上的热门话题，还是理解人工智能如何识别图像、搜索引擎如何工作，都可以运用计算思维的方法。</p>

                <p>它教会你用结构化的方式思考问题，从复杂的表象中找出核心规律，设计出一步步可执行的方案。这种能力在信息爆炸、技术飞速发展的今天尤为宝贵。</p>

                <p>通过学习计算思维，你不仅能更好地理解计算机科学、编程、AI和互联网这些前沿领域，更能提升自己的逻辑思维、批判性思维和解决问题的能力，为未来的学习和生活打下坚实的基础！</p>

                <p>现在，当你再看到一个复杂的程序、一个智能的机器人，或者一个你每天都在用的互联网应用时，不妨停下来想一想：它们背后蕴含着怎样的计算思维呢？它们是如何通过分解、模式识别、抽象和算法设计来实现如此强大的功能的？</p>

                <p>希望这能激发你们的好奇心，去探索计算思维的更多奥秘！</p>
            `;
        }
    }
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Show interactive example modal
function showInteractiveExample() {
    const modal = document.getElementById('interactive-modal');
    if (modal) {
        modal.classList.remove('hidden');
        resetGame(); // Reset game state when modal is shown
    }
}

// Hide interactive example modal
function hideInteractiveExample() {
    const modal = document.getElementById('interactive-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Make a guess in the number guessing game
function makeGuess() {
    const guessInput = document.getElementById('guess-input');
    const feedback = document.getElementById('game-feedback');
    const guessCountDisplay = document.getElementById('guess-count');
    const rangeDisplay = document.getElementById('range-display');
    
    if (!guessInput || !feedback || !guessCountDisplay || !rangeDisplay) return;
    
    const guess = parseInt(guessInput.value);
    
    if (isNaN(guess) || guess < minRange || guess > maxRange) {
        feedback.innerHTML = `<span class="text-red-500">请输入 ${minRange} 到 ${maxRange} 之间的数字！</span>`;
        return;
    }
    
    guessCount++;
    guessCountDisplay.textContent = guessCount;
    
    if (guess === targetNumber) {
        feedback.innerHTML = `<span class="text-green-500">🎉 恭喜你猜对了！数字就是 ${targetNumber}！你用了 ${guessCount} 次。</span>`;
        guessInput.disabled = true;
    } else if (guess < targetNumber) {
        minRange = Math.max(minRange, guess + 1);
        feedback.innerHTML = `<span class="text-blue-500">太小了！试试更大的数字。</span>`;
        rangeDisplay.textContent = `${minRange} - ${maxRange}`;
    } else {
        maxRange = Math.min(maxRange, guess - 1);
        feedback.innerHTML = `<span class="text-orange-500">太大了！试试更小的数字。</span>`;
        rangeDisplay.textContent = `${minRange} - ${maxRange}`;
    }
    
    if (minRange > maxRange && guess !== targetNumber) { // Handle impossible range
        feedback.innerHTML = `<span class="text-red-500">咦？范围好像出错了。请重置游戏。</span>`;
        guessInput.disabled = true;
    } else if (minRange === maxRange && minRange === targetNumber && guess !== targetNumber) {
         // If range narrows to the target number but user hasn't guessed it
         // this shouldn't happen if logic is correct, but as a safe guard
    }


    guessInput.value = '';
    guessInput.focus();
    
    if (guessCount === 3 && guess !== targetNumber) {
        const tipElement = document.createElement('p');
        tipElement.className = "text-purple-500 text-sm mt-2";
        tipElement.innerHTML = `💡 <strong>计算思维提示：</strong>尝试猜测范围的中间值 (例如 ${Math.floor((minRange + maxRange) / 2)})，这样每次都能排除近一半的可能性！`;
        // Ensure tip is not added multiple times
        if (!feedback.querySelector('.text-purple-500')) {
            feedback.appendChild(tipElement);
        }
    }
}

// Reset the guessing game
function resetGame() {
    targetNumber = Math.floor(Math.random() * 100) + 1;
    guessCount = 0;
    minRange = 1;
    maxRange = 100;
    
    const guessInput = document.getElementById('guess-input');
    const feedback = document.getElementById('game-feedback');
    const guessCountDisplay = document.getElementById('guess-count');
    const rangeDisplay = document.getElementById('range-display');
    
    if (guessInput) {
        guessInput.value = '';
        guessInput.disabled = false;
        guessInput.focus();
    }
    if (feedback) feedback.innerHTML = '';
    if (guessCountDisplay) guessCountDisplay.textContent = '0';
    if (rangeDisplay) rangeDisplay.textContent = '1 - 100';
}

// Add enter key support for guessing game
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const modal = document.getElementById('interactive-modal');
        if (modal && !modal.classList.contains('hidden')) {
            if(document.activeElement === document.getElementById('guess-input')) {
                makeGuess();
            }
        }
    }
});

// Add smooth scroll behavior to all internal links in nav
document.querySelectorAll('header a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToSection(this.getAttribute('href').substring(1));
    });
});


// --- Interactive Quizzes ---

const quizData = {
    decomposition: {
        steps: [
            { id: 'step1', text: '准备面团' },
            { id: 'step2', text: '制作酱料' },
            { id: 'step3', text: '准备馅料' },
            { id: 'step4', text: '烘烤披萨' }
        ],
        correctOrder: ['step1', 'step2', 'step3', 'step4']
    }
};

let draggedItem = null;

function initializeQuizzes() {
    // Problem Decomposition Quiz Setup
    const sourceContainer = document.getElementById('decomposition-source');
    const targetContainer = document.getElementById('decomposition-target');
    const feedbackEl = document.getElementById('decomposition-feedback');

    if (sourceContainer && targetContainer && feedbackEl) {
        // Shuffle and display draggable items
        const shuffledSteps = [...quizData.decomposition.steps].sort(() => Math.random() - 0.5);
        shuffledSteps.forEach(step => {
            const div = document.createElement('div');
            div.id = step.id;
            div.textContent = step.text;
            div.draggable = true;
            div.className = 'p-2 bg-rose-100 border border-rose-300 rounded-md cursor-grab text-sm text-rose-700';
            div.addEventListener('dragstart', handleDragStart);
            sourceContainer.appendChild(div);
        });

        targetContainer.addEventListener('dragover', handleDragOver);
        targetContainer.addEventListener('drop', handleDrop);
        targetContainer.addEventListener('dragenter', (e) => e.preventDefault()); // Necessary for some browsers
    } else {
        console.error("Decomposition quiz elements not found.");
    }
}

function handleDragStart(e) {
    draggedItem = e.target;
    e.dataTransfer.setData('text/plain', e.target.id);
    e.target.classList.add('opacity-50');
    // Remove placeholder text from target if it exists
    const targetContainer = document.getElementById('decomposition-target');
    const placeholder = targetContainer.querySelector('.text-xs.text-gray-500');
    if (placeholder && targetContainer.children.length === 1) { // only placeholder exists
        placeholder.style.display = 'none';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const targetContainer = document.getElementById('decomposition-target');
    const afterElement = getDragAfterElement(targetContainer, e.clientY);
    if (afterElement == null) {
        targetContainer.appendChild(draggedItem);
    } else {
        targetContainer.insertBefore(draggedItem, afterElement);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.opacity-50)')]; // :not(.dragging)
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedItem && e.currentTarget.id === 'decomposition-target') {
        // draggedItem is already moved by handleDragOver
        draggedItem.classList.remove('opacity-50');
         // If target is empty after drop (meaning it was last item from source), show placeholder in source if source is empty.
        const sourceContainer = document.getElementById('decomposition-source');
        if (sourceContainer.children.length === 0 && !sourceContainer.querySelector('.text-xs.text-gray-500')) {
            const placeholder = document.createElement('span');
            placeholder.className = 'text-xs text-gray-500 italic';
            placeholder.textContent = '所有步骤已移出';
            sourceContainer.appendChild(placeholder);
        }
    }
    draggedItem = null;
}


function checkDecompositionQuiz() {
    const targetContainer = document.getElementById('decomposition-target');
    const feedbackEl = document.getElementById('decomposition-feedback');
    if (!targetContainer || !feedbackEl) return;

    const currentOrder = Array.from(targetContainer.children)
                              .filter(el => el.draggable) // only consider draggable items
                              .map(el => el.id);
    const correct = JSON.stringify(currentOrder) === JSON.stringify(quizData.decomposition.correctOrder);

    if (currentOrder.length < quizData.decomposition.correctOrder.length) {
        feedbackEl.textContent = '请将所有步骤都拖到右边框中再检查。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-yellow-600';
        return;
    }

    if (correct) {
        feedbackEl.textContent = '太棒了！顺序正确！👍';
        feedbackEl.className = 'text-sm mt-2 h-4 text-green-600 font-semibold';
    } else {
        feedbackEl.textContent = '顺序不对哦，再试试看。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-red-600 font-semibold';
    }
}

function checkPatternQuiz() {
    const input = document.getElementById('pattern-input');
    const feedbackEl = document.getElementById('pattern-feedback');
    if (!input || !feedbackEl) return;
    const correctAnswer = 25; // 1, 4, 9, 16, (25 = 5^2)
    if (parseInt(input.value) === correctAnswer) {
        feedbackEl.textContent = '正确！下一个是25 (5的平方)。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-green-600 font-semibold';
    } else if (input.value.trim() === '') {
        feedbackEl.textContent = '请输入你的答案。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-yellow-600';
    }
    else {
        feedbackEl.textContent = '不对哦，再想想规律。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-red-600 font-semibold';
    }
}

function checkAbstractionQuiz() {
    const feedbackEl = document.getElementById('abstraction-feedback');
    if(!feedbackEl) return;
    const selectedOption = document.querySelector('input[name="abstraction"]:checked');
    if (!selectedOption) {
        feedbackEl.textContent = '请选择一个选项。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-yellow-600';
        return;
    }
    if (selectedOption.value === 'b') { // B. 沿途每棵树的颜色
        feedbackEl.textContent = '回答正确！树的颜色通常不影响认路。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-green-600 font-semibold';
    } else {
        feedbackEl.textContent = '再想想哪个信息最不关键。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-red-600 font-semibold';
    }
}

function checkAlgorithmQuiz() {
    const feedbackEl = document.getElementById('algorithm-feedback');
    if(!feedbackEl) return;
    const selectedOption = document.querySelector('input[name="algorithm"]:checked');
    if (!selectedOption) {
        feedbackEl.textContent = '请选择一个选项。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-yellow-600';
        return;
    }
    if (selectedOption.value === 'a') { // A. 2, 1, 3, 4 (拿杯子，放茶叶，倒水，等待)
        feedbackEl.textContent = '非常棒！这才是正确的泡茶顺序。';
        feedbackEl.className = 'text-sm mt-2 h-4 text-green-600 font-semibold';
    } else {
        feedbackEl.textContent = '顺序不对，泡茶的步骤很重要哦！';
        feedbackEl.className = 'text-sm mt-2 h-4 text-red-600 font-semibold';
    }
}

// --- SVG Interaction ---
function initSVGInteractions() {
    const svg = document.querySelector('.computational-thinking-svg');
    if (!svg) return;

    const groups = svg.querySelectorAll('g[data-id]');

    groups.forEach(group => {
        const box = group.querySelector('.svg-box');
        const text = group.querySelector('.svg-text');

        if (box && text) {
            group.addEventListener('mouseover', () => {
                box.classList.add('svg-box-highlight');
                text.classList.add('svg-text-highlight');
            });
            group.addEventListener('mouseout', () => {
                box.classList.remove('svg-box-highlight');
                text.classList.remove('svg-text-highlight');
            });
        }
    });
}

// Scroll-triggered animations for sections (can be simplified or removed if not essential)
// Keeping the simple scroll reveal for .bg-white elements, but only if they are direct children of main sections.
function addScrollAnimations() {
    const animatedElements = document.querySelectorAll('main > section > .bg-white, main > section > .bg-gradient-to-r');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observerInstance.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            el.classList.add('opacity-0'); // Initial state for animation
            observer.observe(el);
        });
    } else { // Fallback for older browsers
        animatedElements.forEach(el => el.classList.add('fade-in-up'));
    }
}

document.addEventListener('DOMContentLoaded', addScrollAnimations);
