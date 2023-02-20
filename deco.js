const fileInput1 = document.getElementById('file-input1');
const fileName1 = document.querySelector('.file-name1');
fileInput1.addEventListener('change', function() {
    if (this.files && this.files.length > 1) {
        fileName1.textContent = this.files.length + ' files selected';
    } else {
        fileName1.textContent = this.files[0].name;
    }
});
let fileInput2 = document.getElementById('file-input2');
const fileName2 = document.querySelector('.file-name2');
fileInput2.addEventListener('change', function() {
    if (this.files && this.files.length > 1) {
        fileName2.textContent = this.files.length + ' files selected';
    } else {
        fileName2.textContent = this.files[0].name;
    }
});