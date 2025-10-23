/**
 * Frontend JavaScript for Lex Semantic application
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const inputMethodRadios = document.querySelectorAll('input[name="inputMethod"]');
    const textInputSection = document.getElementById('textInputSection');
    const pdfUploadSection = document.getElementById('pdfUploadSection');
    const processTextBtn = document.getElementById('processTextBtn');
    const processPdfBtn = document.getElementById('processPdfBtn');
    const pdfFileInput = document.getElementById('pdfFile');
    const processingCard = document.getElementById('processingCard');
    const resultCard = document.getElementById('resultCard');
    const nlpResultCard = document.getElementById('nlpResultCard');
    const inputMethodCard = document.getElementById('inputMethodCard');
    const formattedTextElement = document.getElementById('formattedText');
    const editTextBtn = document.getElementById('editTextBtn');
    const finalizeBtn = document.getElementById('finalizeBtn');
    const backToEditBtn = document.getElementById('backToEditBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Switch between input methods
    inputMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'paste') {
                textInputSection.style.display = 'block';
                pdfUploadSection.style.display = 'none';
            } else if (this.value === 'upload') {
                textInputSection.style.display = 'none';
                pdfUploadSection.style.display = 'block';
            }
        });
    });

    // PDF file input change
    pdfFileInput.addEventListener('change', function() {
        processPdfBtn.disabled = !this.files.length;
    });

    // Process text button
    processTextBtn.addEventListener('click', function() {
        const text = document.getElementById('textInput').value;
        if (!text.trim()) {
            alert('Please enter some text.');
            return;
        }
        processText(text);
    });

    // Process PDF button
    processPdfBtn.addEventListener('click', function() {
        const file = pdfFileInput.files[0];
        if (!file) {
            alert('Please select a PDF file.');
            return;
        }
        processPDF(file);
    });

    // Edit text functionality
    editTextBtn.addEventListener('click', function() {
        const currentText = formattedTextElement.textContent;
        const newText = prompt('Edit your text:', currentText);
        if (newText !== null) {
            formattedTextElement.textContent = newText;
        }
    });

    // Process functionality (NLP Analysis)
    finalizeBtn.addEventListener('click', async function() {
        const text = formattedTextElement.textContent;
        if (!text) {
            alert('No text to process.');
            return;
        }

        await processWithNLP(text);
    });

    // Back to edit functionality
    backToEditBtn.addEventListener('click', function() {
        nlpResultCard.style.display = 'none';
        resultCard.style.display = 'block';
    });

    // Download functionality
    downloadBtn.addEventListener('click', function() {
        const highlightedText = document.getElementById('highlightedText').innerHTML;
        const nounCount = document.getElementById('nounCount').textContent;
        const verbCount = document.getElementById('verbCount').textContent;
        
        const content = `NLP Analysis Results\n\nNouns: ${nounCount}\nVerbs: ${verbCount}\n\nHighlighted Text:\n${highlightedText.replace(/<[^>]*>/g, '')}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nlp-analysis.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Helper function to show processing state
    function showProcessing() {
        inputMethodCard.style.display = 'none';
        processingCard.style.display = 'block';
        resultCard.style.display = 'none';
    }

    // Helper function to show result
    function showResult(formattedText) {
        inputMethodCard.style.display = 'none';
        processingCard.style.display = 'none';
        resultCard.style.display = 'block';
        nlpResultCard.style.display = 'none';
        formattedTextElement.textContent = formattedText;
    }

    // Helper function to show NLP result
    function showNLPResult(analysis) {
        inputMethodCard.style.display = 'none';
        processingCard.style.display = 'none';
        resultCard.style.display = 'none';
        nlpResultCard.style.display = 'block';
        
        document.getElementById('highlightedText').innerHTML = analysis.highlightedText;
        document.getElementById('nounCount').textContent = analysis.nounCount;
        document.getElementById('verbCount').textContent = analysis.verbCount;
    }

    // Helper function to process text
    async function processText(text) {
        showProcessing();
        
        try {
            const response = await fetch('/api/process-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            
            if (response.ok) {
                showResult(data.formattedText);
            } else {
                throw new Error(data.error || 'Failed to process text');
            }
        } catch (error) {
            alert('Error processing text: ' + error.message);
            resetForm();
        }
    }

    // Helper function to process PDF
    async function processPDF(file) {
        showProcessing();
        
        try {
            const formData = new FormData();
            formData.append('pdf', file);

            const response = await fetch('/api/process-pdf', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                showResult(data.formattedText);
            } else {
                throw new Error(data.error || 'Failed to process PDF');
            }
        } catch (error) {
            alert('Error processing PDF: ' + error.message);
            resetForm();
        }
    }

    // Helper function to process with NLP
    async function processWithNLP(text) {
        showProcessing();
        
        try {
            const response = await fetch('/api/analyze-nlp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const analysis = await response.json();
            
            if (response.ok) {
                showNLPResult(analysis);
            } else {
                throw new Error(analysis.error || 'Failed to analyze text');
            }
        } catch (error) {
            alert('Error analyzing text: ' + error.message);
            showResult(text); // Fallback to showing original text
        }
    }

    // Helper function to reset form
    function resetForm() {
        inputMethodCard.style.display = 'block';
        processingCard.style.display = 'none';
        resultCard.style.display = 'none';
        nlpResultCard.style.display = 'none';
        document.getElementById('textInput').value = '';
        pdfFileInput.value = '';
        processPdfBtn.disabled = true;
    }
});
