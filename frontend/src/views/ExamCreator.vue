<template>
  <div class="exam-creator-container p-6 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">Exam Creator</h1>

    <!-- Exam Basic Info -->
    <section class="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
      <h2 class="text-xl font-semibold text-blue-400 mb-4">Exam Details</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-400 text-sm mb-1">Exam Title</label>
          <input v-model="exam.title" type="text" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none" placeholder="e.g. Mid-term Physics">
        </div>
        <div>
          <label class="block text-gray-400 text-sm mb-1">Duration (Minutes)</label>
          <input v-model.number="exam.duration" type="number" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none">
        </div>
        <div class="md:col-span-2">
          <label class="block text-gray-400 text-sm mb-1">Instructions</label>
          <textarea v-model="exam.instructions" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none" rows="3"></textarea>
        </div>
      </div>
    </section>

    <!-- Question Entry Method Tabs -->
    <div class="flex gap-4 mb-6">
      <button @click="tab = 'manual'" :class="tab === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-4 py-2 rounded-lg transition-colors font-medium">Manual Entry</button>
      <button @click="tab = 'pdf'" :class="tab === 'pdf' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-4 py-2 rounded-lg transition-colors font-medium">PDF Import</button>
    </div>

    <!-- Manual Entry Tab -->
    <div v-if="tab === 'manual'" class="space-y-6">
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 class="text-lg font-semibold text-white mb-4">Add New Question</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-gray-400 text-sm mb-1">Question Text</label>
            <textarea v-model="newQuestion.text" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none" rows="2"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-400 text-sm mb-1">Type</label>
              <select v-model="newQuestion.type" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none">
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="short_answer">Short Answer</option>
                <option value="long_answer">Long Answer</option>
                <option value="math">Mathematics</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-400 text-sm mb-1">Marks</label>
              <input v-model.number="newQuestion.marks" type="number" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none">
            </div>
          </div>

          <!-- MCQ Options -->
          <div v-if="newQuestion.type === 'mcq'" class="space-y-2 mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <p class="text-sm text-gray-400 mb-2">Options (Check the correct one)</p>
            <div v-for="(opt, index) in newQuestion.options" :key="index" class="flex items-center gap-2 mb-2">
              <input type="checkbox" v-model="opt.isCorrect" class="w-4 h-4">
              <input v-model="opt.text" type="text" class="flex-1 bg-gray-800 text-white p-1 px-2 rounded border border-gray-600 outline-none" :placeholder="'Option ' + (index + 1)">
              <button @click="removeOption(index)" class="text-red-500 hover:text-red-400">✕</button>
            </div>
            <button @click="addOption" class="text-xs text-blue-400 hover:text-blue-300">+ Add Option</button>
          </div>

          <button @click="saveQuestion" :disabled="isSaving" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors disabled:opacity-50">
            {{ isSaving ? 'Saving...' : 'Add Question to Exam' }}
          </button>
        </div>
      </div>
    </div>

    <!-- PDF Import Tab -->
    <div v-if="tab === 'pdf'" class="space-y-6">
      <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
        <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-blue-500 transition-colors cursor-pointer" @click="triggerFileUpload">
          <input type="file" ref="fileInput" @change="handleFileUpload" class="hidden" accept="application/pdf">
          <div v-if="!pdfProcessing">
            <div class="text-5xl mb-4">📄</div>
            <p class="text-white text-lg font-medium">Click to upload PDF</p>
            <p class="text-gray-400 text-sm">Extract questions automatically</p>
          </div>
          <div v-else class="py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-white">Processing PDF... Please wait</p>
          </div>
        </div>
      </div>

      <!-- PDF Review Grid -->
      <div v-if="parsedQuestions.length > 0" class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold text-white">Review Extracted Questions</h3>
          <button @click="importAllQuestions" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium transition-colors">
            Import Selected to Exam
          </button>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <div v-for="(q, index) in parsedQuestions" :key="index" class="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
            <input type="checkbox" v-model="q.selected" class="mt-2 w-5 h-5">
            <div class="flex-1 space-y-3">
              <input v-model="q.text" class="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 outline-none">
              <div class="flex gap-4">
                <select v-model="q.type" class="bg-gray-900 text-white p-1 rounded border border-gray-600 text-sm">
                  <option value="mcq">MCQ</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="long_answer">Long Answer</option>
                </select>
                <input v-model.number="q.marks" type="number" class="w-16 bg-gray-900 text-white p-1 rounded border border-gray-600 text-sm">
              </div>
            </div>
            <button @click="parsedQuestions.splice(index, 1)" class="text-red-500 hover:text-red-400">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Final Action -->
    <div class="mt-12 flex justify-end gap-4">
      <button @click="saveExamDetails" class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium">Save Draft</button>
      <button @click="publishExam" :disabled="exam.title === ''" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold shadow-lg disabled:opacity-50">
        Publish Exam
      </button>
    </div>
  </div>
</template>

<script>
import api from '../js/api.js';

export default {
  name: 'ExamCreator',
  data() {
    return {
      tab: 'manual',
      isSaving: false,
      pdfProcessing: false,
      exam: {
        title: '',
        duration: 60,
        instructions: '',
        totalMarks: 0
      },
      newQuestion: {
        text: '',
        type: 'short_answer',
        marks: 1,
        options: [],
        rubric: { keywords: [], answerKey: '', method: 'keyword' }
      },
      parsedQuestions: []
    }
  },
  methods: {
    addOption() {
      this.newQuestion.options.push({ text: '', isCorrect: false });
    },
    removeOption(index) {
      this.newQuestion.options.splice(index, 1);
    },
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.pdfProcessing = true;
      try {
        const uploadResult = await api.uploadPDF(file);
        const parseResult = await api.parsePDFText(uploadResult.text);
        this.parsedQuestions = parseResult.questions.map(q => ({ ...q, selected: true }));
      } catch (err) {
        alert('PDF Error: ' + err.message);
      } finally {
        this.pdfProcessing = false;
      }
    },
    async saveQuestion() {
      if (!this.exam.id) {
        alert('Please create the exam first before adding questions.');
        return;
      }
      this.isSaving = true;
      try {
        await api.addQuestion(this.exam.id, this.newQuestion);
        this.newQuestion.text = '';
        this.newQuestion.options = [];
        alert('Question added!');
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        this.isSaving = false;
      }
    },
    async importAllQuestions() {
      const selected = this.parsedQuestions.filter(q => q.selected);
      if (!this.exam.id) {
        alert('Please create the exam first.');
        return;
      }
      try {
        await api.bulkAddQuestions(this.exam.id, selected);
        this.parsedQuestions = [];
        alert('Questions imported successfully!');
      } catch (err) {
        alert('Error importing: ' + err.message);
      }
    },
    async saveExamDetails() {
      try {
        const result = await api.createExam(this.exam);
        this.exam.id = result.exam._id;
        alert('Exam draft saved!');
      } catch (err) {
        alert('Error: ' + err.message);
      }
    },
    async publishExam() {
      if (!this.exam.id) {
        await this.saveExamDetails();
      }
      try {
        await api.publishExam(this.exam.id);
        alert('Exam published successfully!');
        this.$router.push('/dashboard');
      } catch (err) {
        alert('Publish failed: ' + err.message);
      }
    }
  }
}
</script>
