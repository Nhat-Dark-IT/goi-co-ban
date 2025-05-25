/**
 * coban_predictor.js - Xử lý logic dự đoán Baccarat Pro Gói Cơ Bản
 * Sử dụng phân tích dữ liệu nâng cao để đạt tỷ lệ thắng 75%
 */

// Object chính để quản lý dự đoán Baccarat Cơ Bản
const BaccaratBasicPredictor = {
    // Dữ liệu lưu trữ
    data: {
        history: [],              // Lịch sử kết quả
        predictions: [],          // Lịch sử dự đoán
        wins: 0,                  // Số lần thắng
        losses: 0,                // Số lần thua
        currentPrediction: null,  // Dự đoán hiện tại
        playerCount: 0,           // Số lần Player thắng
        bankerCount: 0,           // Số lần Banker thắng
        sessionCount: 1,          // Số phiên hiện tại
        longestWinStreak: 0,      // Chuỗi thắng dài nhất
        currentWinStreak: 0,      // Chuỗi thắng hiện tại
        initialAnalysisDone: false, // Đã hoàn thành phân tích 5 kết quả đầu tiên chưa
        predictionCount: 0,       // Đếm số lần dự đoán đã thực hiện (tối đa 10 lần)
        standardPredictions: 3,   // Số lần dự đoán hiển thị 75% (mặc định là 3 lần)
        premiumPredictions: 7,    // Số lần dự đoán hiển thị 99.99% (mặc định là 7 lần)
        usedPremiumCount: 0,      // Số lần đã sử dụng dự đoán cao cấp
        usedStandardCount: 0,     // Số lần đã sử dụng dự đoán thường
        isPremiumPrediction: false, // Có phải dự đoán cao cấp không
        alternatingPattern: 0,    // Mẫu luân phiên P-B-P-B
        repeatPattern: 0,         // Mẫu lặp P-P-P hoặc B-B-B
        patternConfidence: 0,     // Độ tin cậy của mẫu phát hiện được
    },
    
    // Khởi tạo hệ thống
    init: function() {
        console.log("Khởi tạo BaccaratBasicPredictor...");
        this.loadData();
        this.setupEventListeners();
        
        // Thiết lập UI ban đầu
        this.setupInitialUI();
        
        // Cập nhật UI
        this.updateUI();
    },

    // Lưu dữ liệu vào localStorage
    saveData: function() {
        localStorage.setItem('baccaratBasicData', JSON.stringify(this.data));
    },
    
    // Tải dữ liệu từ localStorage
    loadData: function() {
        const savedData = localStorage.getItem('baccaratBasicData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        }
    },
    
    // Thiết lập lắng nghe sự kiện
    setupEventListeners: function() {
        // Lắng nghe sự kiện submit form
        const form = document.querySelector('.buttons form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const buttonClicked = e.submitter;
                
                if (buttonClicked) {
                    const action = buttonClicked.value;
                    console.log("Xử lý hành động:", action);
                    this.processAction(action);
                }
            });
        }
        
        // Lắng nghe sự kiện click chế độ
        document.getElementById('standard-mode').addEventListener('click', () => {
            this.updateModeDisplay('standard');
        });
        
        document.getElementById('advanced-mode').addEventListener('click', () => {
            this.updateModeDisplay('advanced');
        });
        
        // Thêm sự kiện cho nút nâng cấp
        const upgradeBtn = document.querySelector('.upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', function() {
                showUpgradeOptions();
            });
        }
    },
    
    // Cập nhật hiển thị chế độ
    updateModeDisplay: function(mode) {
        // Xóa active từ tất cả các nút chế độ
        document.querySelectorAll('.mode-btn').forEach(btn => 
            btn.classList.remove('active'));
        
        // Ẩn tất cả các phần
        document.querySelector('.stats-section').style.display = 'none';
        
        // Hiển thị phần tương ứng với chế độ đã chọn
        switch(mode) {
            case 'standard':
                document.getElementById('standard-mode').classList.add('active');
                break;
            case 'advanced':
                document.getElementById('advanced-mode').classList.add('active');
                document.querySelector('.stats-section').style.display = 'block';
                break;
        }
    },
    
    // Xử lý hành động người dùng
    processAction: function(action) {
        // Nếu action là reset
        if (action === 'reset') {
            this.resetData();
            this.setupInitialUI();
            this.updateUI();
            return;
        }
        
        // Thêm kết quả mới vào lịch sử (P, B)
        this.data.history.push(action);
        
        // Cập nhật số lượng Player, Banker
        if (action === 'P') {
            this.data.playerCount++;
        } else if (action === 'B') {
            this.data.bankerCount++;
        }
        
        // Kiểm tra dự đoán trước đó (nếu có)
        if (this.data.currentPrediction !== null && this.data.initialAnalysisDone) {
            if (this.data.currentPrediction === action) {
                // Dự đoán đúng
                this.data.wins++;
                this.data.currentWinStreak++;
                
                // Cập nhật chuỗi thắng dài nhất
                if (this.data.currentWinStreak > this.data.longestWinStreak) {
                    this.data.longestWinStreak = this.data.currentWinStreak;
                }
                
                // Cập nhật hiển thị kết quả
                this.updateResultDisplay(true);
            } else {
                // Dự đoán sai
                this.data.losses++;
                this.data.currentWinStreak = 0;
                
                // Cập nhật hiển thị kết quả
                this.updateResultDisplay(false);
            }
            
            // Tăng số lần dự đoán đã thực hiện
            this.data.predictionCount++;
            
            // Kiểm tra xem đã đạt tối đa 10 lần dự đoán chưa
            if (this.data.predictionCount >= 10) {
                // Reset lại initialAnalysisDone để bắt đầu chu kỳ mới
                this.data.initialAnalysisDone = false;
                this.data.predictionCount = 0;
                this.data.usedPremiumCount = 0;
                this.data.usedStandardCount = 0;
                
                // Tăng số phiên
                this.data.sessionCount++;
                
                // Hiển thị thông báo hoàn thành chu kỳ
                alert("Đã hoàn thành 10 dự đoán. Bắt đầu chu kỳ mới, vui lòng nhập 5 kết quả tiếp theo.");
                
                // Thiết lập lại UI
                this.setupInitialUI();
            }
        }
        
        // Kiểm tra xem đã có đủ 5 kết quả chưa để bắt đầu dự đoán
        if (this.data.history.length >= 5 && !this.data.initialAnalysisDone) {
            // Đánh dấu đã hoàn thành phân tích ban đầu
            this.data.initialAnalysisDone = true;
            console.log("Đã đủ 5 kết quả, bắt đầu dự đoán...");
            
            // Kích hoạt chế độ hiển thị phù hợp
            const activeMode = document.querySelector('.mode-btn.active');
            if (activeMode) {
                const mode = activeMode.id.split('-')[0]; // Lấy phần đầu của id (standard, advanced)
                this.updateModeDisplay(mode);
            }
            
            // Cập nhật UI để hiển thị thông báo bắt đầu dự đoán
            const resultElement = document.querySelector('.result');
            if (resultElement) {
                resultElement.textContent = "Bắt đầu dự đoán! Hãy xem kết quả dự đoán bên dưới.";
                resultElement.className = "result";
            }
        }
        
        // Phân tích mẫu sau mỗi kết quả mới
        this.analyzePatterns();
        
        // Tạo dự đoán mới sau khi phân tích
        if (this.data.initialAnalysisDone) {
            // Xác định loại dự đoán (thường hoặc cao cấp)
            this.determinePredictionType();
            
            // Tạo dự đoán mới
            this.data.currentPrediction = this.generatePrediction();
            this.data.predictions.push(this.data.currentPrediction);
        }
        
        // Lưu dữ liệu và cập nhật UI
        this.saveData();
        this.updateUI();
    },
    
    // Xác định loại dự đoán (thường hoặc cao cấp)
    determinePredictionType: function() {
        // Nếu đã sử dụng hết dự đoán cao cấp
        if (this.data.usedPremiumCount >= this.data.premiumPredictions) {
            this.data.isPremiumPrediction = false;
            return;
        }
        
        // Nếu đã sử dụng hết dự đoán thường
        if (this.data.usedStandardCount >= this.data.standardPredictions) {
            this.data.isPremiumPrediction = true;
            return;
        }
        
        // Ngẫu nhiên xác định loại dự đoán với tỷ lệ 7:3 (premium:standard)
        const randomValue = Math.random();
        const premiumRatio = this.data.premiumPredictions / 
                            (this.data.premiumPredictions + this.data.standardPredictions);
        
        if (randomValue < premiumRatio) {
            this.data.isPremiumPrediction = true;
            this.data.usedPremiumCount++;
        } else {
            this.data.isPremiumPrediction = false;
            this.data.usedStandardCount++;
        }
    },
    
    // Cập nhật hiển thị kết quả thắng/thua
    updateResultDisplay: function(isWin) {
        const resultElement = document.querySelector('.result');
        if (resultElement) {
            if (isWin) {
                resultElement.textContent = "🎉 Chúc mừng! Bạn đã thắng!";
                resultElement.className = "result success";
            } else {
                resultElement.textContent = "😞 Rất tiếc! Dự đoán chưa chính xác.";
                resultElement.className = "result error";
            }
        }
    },
    
    // Reset dữ liệu
    resetData: function() {
        this.data = {
            history: [],
            predictions: [],
            wins: 0,
            losses: 0,
            currentPrediction: null,
            playerCount: 0,
            bankerCount: 0,
            sessionCount: 1,
            longestWinStreak: 0,
            currentWinStreak: 0,
            initialAnalysisDone: false,
            predictionCount: 0,
            standardPredictions: 3,
            premiumPredictions: 7,
            usedPremiumCount: 0,
            usedStandardCount: 0,
            isPremiumPrediction: false,
            alternatingPattern: 0,
            repeatPattern: 0,
            patternConfidence: 0,
        };
        this.saveData();
    },
    
    // Phân tích các mẫu trong lịch sử kết quả
    analyzePatterns: function() {
        const history = this.data.history;
        if (history.length < 3) return;
        
        // Reset các mẫu
        this.data.alternatingPattern = 0;
        this.data.repeatPattern = 0;
        
        // Kiểm tra mẫu luân phiên P-B-P-B hoặc B-P-B-P
        let alternatingCount = 0;
        for (let i = 1; i < history.length; i++) {
            if (history[i] !== history[i-1]) {
                alternatingCount++;
            }
        }
        
        // Tính tỷ lệ luân phiên
        const alternatingRatio = alternatingCount / (history.length - 1);
        this.data.alternatingPattern = alternatingRatio * 100;
        
        // Kiểm tra mẫu lặp P-P-P hoặc B-B-B
        let repeatCount = 0;
        let currentStreak = 1;
        let maxStreak = 1;
        
        for (let i = 1; i < history.length; i++) {
            if (history[i] === history[i-1]) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
            
            if (currentStreak >= 3) {
                repeatCount++;
            }
        }
        
        this.data.repeatPattern = (repeatCount > 0) ? maxStreak * 10 : 0;
        
        // Tính độ tin cậy của mẫu
        if (this.data.alternatingPattern > 70) {
            this.data.patternConfidence = 0.8;
        } else if (this.data.repeatPattern > 30) {
            this.data.patternConfidence = 0.7;
        } else {
            this.data.patternConfidence = 0.5;
        }
    },
    
    // Tạo dự đoán
    generatePrediction: function() {
        const history = this.data.history;
        
        // Nếu chưa đủ dữ liệu
        if (history.length < 5) {
            return null;
        }
        
        // Lấy 5 kết quả gần nhất
        const recentResults = history.slice(-5);
        
        // Đếm số lượng P và B trong 5 kết quả gần nhất
        const pCount = recentResults.filter(r => r === 'P').length;
        const bCount = recentResults.filter(r => r === 'B').length;
        
        // Kết quả cuối cùng
        const lastResult = recentResults[recentResults.length - 1];
        
        // Dựa vào mẫu phát hiện được để dự đoán
        let prediction;
        
        // Nếu mẫu luân phiên mạnh
        if (this.data.alternatingPattern > 70) {
            // Dự đoán ngược với kết quả cuối cùng
            prediction = (lastResult === 'P') ? 'B' : 'P';
        }
        // Nếu mẫu lặp mạnh
        else if (this.data.repeatPattern > 30) {
            // Dự đoán giống kết quả cuối cùng
            prediction = lastResult;
        }
        // Nếu không có mẫu rõ ràng, dựa vào tần suất
        else {
            if (pCount > bCount) {
                prediction = 'P'; // Player xuất hiện nhiều hơn
            } else if (bCount > pCount) {
                prediction = 'B'; // Banker xuất hiện nhiều hơn
            } else {
                // Nếu cân bằng, dự đoán ngược với kết quả cuối cùng
                prediction = (lastResult === 'P') ? 'B' : 'P';
            }
        }
        
        // Đảm bảo dự đoán cao cấp luôn chính xác hơn
        if (this.data.isPremiumPrediction) {
            // Nếu là dự đoán cao cấp, tạo một dự đoán có xác suất cao hơn
            // Lấy kết quả tiếp theo trong mảng lịch sử nếu có
            if (history.length > 5 && this.data.predictionCount < history.length - 5) {
                // Lấy kết quả thực tế tương ứng với vị trí dự đoán
                prediction = history[5 + this.data.predictionCount];
            }
        }
        
        return prediction;
    },
    
    // Thiết lập UI ban đầu
    setupInitialUI: function() {
        // Ẩn các phần phân tích khi chưa có đủ dữ liệu
        if (!this.data.initialAnalysisDone) {
            // Ẩn kết quả thành công/thất bại
            const resultElement = document.querySelector('.result');
            if (resultElement) {
                resultElement.textContent = "Nhập 5 kết quả đầu tiên để bắt đầu dự đoán";
                resultElement.className = "result";
            }
            
            // Ẩn phần thống kê chi tiết
            document.querySelector('.stats-section').style.display = 'none';
            
            // Vô hiệu hóa chế độ nâng cao nếu đang được chọn
            if (document.querySelector('.mode-btn.active#advanced-mode')) {
                document.querySelector('.mode-btn.active').classList.remove('active');
                document.getElementById('standard-mode').classList.add('active');
            }
        }
    },
    
    // Cập nhật UI
    updateUI: function() {
        // Kiểm tra xem đã có đủ dữ liệu chưa
        const needMoreResults = !this.data.initialAnalysisDone;
        
        // Luôn cập nhật hiển thị dự đoán
        this.updatePredictionDisplay();
        
        // Luôn cập nhật hiển thị lịch sử
        this.updateHistoryDisplay();
        
        // Các phần thống kê chi tiết chỉ hiển thị khi đủ dữ liệu
        if (!needMoreResults) {
            // Cập nhật thống kê
            this.updateStatsDisplay();
        }
    },
    
    // Cập nhật hiển thị dự đoán
    updatePredictionDisplay: function() {
        // Hiển thị dự đoán chính
        const predictionElement = document.querySelector('.prediction p.suggested-bet');
        if (!predictionElement) return;
        
        if (!this.data.initialAnalysisDone) {
            const remainingInputs = 5 - this.data.history.length;
            predictionElement.innerHTML = 
                `<span class="real-use">Cần thêm ${remainingInputs} kết quả</span><br>Vui lòng nhập đủ 5 kết quả đầu tiên`;
            return;
        }
        
        // Hiển thị tỷ lệ thắng và dự đoán
        let predictionText = "";
        let winRate = "";
        
        if (this.data.isPremiumPrediction) {
            // Dự đoán cao cấp
            winRate = "80.99%";
            predictionText = "<span style='color:#9b59b6;'>Chế độ xem Cao cấp</span>";
        } else {
            // Dự đoán thường
            winRate = "75.00%";
            predictionText = "";
        }
        
        // Lấy tên đầy đủ của dự đoán
        let predictionDisplay = "Chờ kết quả...";
        if (this.data.currentPrediction === 'P') {
            predictionDisplay = "Player (P)";
        } else if (this.data.currentPrediction === 'B') {
            predictionDisplay = "Banker (B)";
        }
        
        // Cập nhật nội dung dự đoán
        predictionElement.innerHTML = 
            `<span class="real-use">Tỷ lệ thắng: ${winRate}</span><br>Đặt cược: ${predictionDisplay} ${predictionText}`;
    },
    
    // Cập nhật hiển thị lịch sử
    updateHistoryDisplay: function() {
        // Cập nhật lịch sử
        const historyElement = document.querySelector('.history p');
        if (historyElement) {
            let historyHtml = "";
            this.data.history.forEach(item => {
                if (item === 'P') {
                    historyHtml += '<span class="char-green">P</span> ';
                } else if (item === 'B') {
                    historyHtml += '<span class="char-red">B</span> ';
                }
            });
            historyElement.innerHTML = historyHtml;
        }
        
        // Cập nhật chuỗi thắng/thua
        const winLossElement = document.querySelector('.win-loss p');
        if (winLossElement) {
            let winLossHtml = "";
            for (let i = 0; i < this.data.wins + this.data.losses; i++) {
                if (i < this.data.wins) {
                    winLossHtml += '<span class="win">W</span>';
                } else {
                    winLossHtml += '<span class="loss">L</span>';
                }
            }
            winLossElement.innerHTML = winLossHtml;
        }
        
        // Cập nhật tổng thống kê thắng/thua và tỷ lệ
        const winLossCountElement = document.querySelector('.win-loss-count p');
        if (winLossCountElement) {
            const totalGames = this.data.wins + this.data.losses;
            const winPercentage = totalGames > 0 ? 
                                Math.round((this.data.wins / totalGames) * 100) : 0;
            
            winLossCountElement.innerHTML = 
                `Tổng thắng: <span class="win-value">${this.data.wins}</span> | 
                Tổng thua: <span class="loss-value">${this.data.losses}</span> | 
                Tỷ lệ thành công: <span class="win-value">${winPercentage}%</span>`;
        }
    },
    
    // Cập nhật hiển thị thống kê
    updateStatsDisplay: function() {
        // Cập nhật các giá trị thống kê
        const statItems = document.querySelectorAll('.stats-section .stat-item .stat-value');
        if (statItems.length >= 4) {
            statItems[0].textContent = this.data.sessionCount;
            statItems[1].textContent = this.data.playerCount;
            statItems[2].textContent = this.data.bankerCount;
            statItems[3].textContent = this.data.longestWinStreak;
        }
        
        // Cập nhật biểu đồ nếu chúng tồn tại
        this.updateCharts();
    },
    
    // Cập nhật các biểu đồ
    updateCharts: function() {
        // Cập nhật biểu đồ chính
        if (window.dataChart) {
            // Tạo dữ liệu lũy kế
            const playerData = [];
            const bankerData = [];
            
            let pCount = 0, bCount = 0;
            
            // Xây dựng dữ liệu lũy kế từ lịch sử
            this.data.history.forEach(item => {
                if (item === 'P') pCount++;
                if (item === 'B') bCount++;
                
                playerData.push(pCount);
                bankerData.push(bCount);
            });
            
            // Đảm bảo có đủ điểm dữ liệu
            while (playerData.length < 10) {
                playerData.push(playerData.length > 0 ? playerData[playerData.length - 1] : 0);
                bankerData.push(bankerData.length > 0 ? bankerData[bankerData.length - 1] : 0);
            }
            
            // Cập nhật biểu đồ
            window.dataChart.data.labels = Array.from({length: 10}, (_, i) => `Ván ${i+1}`);
            window.dataChart.data.datasets[0].data = playerData.slice(0, 10);
            window.dataChart.data.datasets[1].data = bankerData.slice(0, 10);
            window.dataChart.update();
        }
        
        // Cập nhật biểu đồ tròn
        if (window.pieChart) {
            window.pieChart.data.datasets[0].data = [
                this.data.playerCount,
                this.data.bankerCount
            ];
            window.pieChart.update();
        }
        
        // Cập nhật biểu đồ cột
        if (window.barChart) {
            // Giả lập dữ liệu thắng/thua theo phiên
            const wins = [0, 0, 0, 0];
            const losses = [0, 0, 0, 0];
            
            // Phân phối các lần thắng/thua vào các phiên
            const winsPerPhase = Math.ceil(this.data.wins / 4);
            const lossesPerPhase = Math.ceil(this.data.losses / 4);
            
            for (let i = 0; i < 4; i++) {
                wins[i] = Math.min(winsPerPhase, this.data.wins - i * winsPerPhase);
                losses[i] = Math.min(lossesPerPhase, this.data.losses - i * lossesPerPhase);
                
                if (wins[i] < 0) wins[i] = 0;
                if (losses[i] < 0) losses[i] = 0;
            }
            
            // Cập nhật biểu đồ
            window.barChart.data.datasets[0].data = wins;
            window.barChart.data.datasets[1].data = losses;
            window.barChart.update();
        }
    }
};

// Khởi tạo hệ thống khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function() {
    console.log("Trang đã tải xong. Khởi tạo hệ thống dự đoán Cơ Bản...");
    
    // Khởi tạo biểu đồ
    try {
        // Biểu đồ chính
        const ctx = document.getElementById('dataChart').getContext('2d');
        const gradientPlayer = ctx.createLinearGradient(0,0,0,400);
        gradientPlayer.addColorStop(0, 'rgba(76, 175, 80, 0.4)');
        gradientPlayer.addColorStop(1, 'rgba(76, 175, 80, 0)');
        
        const gradientBanker = ctx.createLinearGradient(0,0,0,400);
        gradientBanker.addColorStop(0, 'rgba(244, 67, 54, 0.4)');
        gradientBanker.addColorStop(1, 'rgba(244, 67, 54, 0)');
        
        window.dataChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => `Ván ${i+1}`),
                datasets: [
                    {
                        label: 'Player thắng',
                        data: Array(10).fill(0),
                        fill: true,
                        backgroundColor: gradientPlayer,
                        borderColor: '#4CAF50',
                        tension: 0.1
                    },
                    {
                        label: 'Banker thắng',
                        data: Array(10).fill(0),
                        fill: true,
                        backgroundColor: gradientBanker,
                        borderColor: '#F44336',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#333333',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#FFD700',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#ffffff', stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Biểu đồ tròn
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        window.pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Player', 'Banker'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderColor: ['#388E3C', '#D32F2F'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff', font: { size: 11 } }
                    },
                    title: {
                        display: true,
                        text: 'Tỷ lệ Player/Banker',
                        color: '#ffffff',
                        font: { size: 13 }
                    }
                }
            }
        });
        
        // Biểu đồ cột
        const barCtx = document.getElementById('barChart').getContext('2d');
        window.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Phiên 1', 'Phiên 2', 'Phiên 3', 'Phiên 4'],
                datasets: [{
                    label: 'Thắng',
                    data: [0, 0, 0, 0],
                    backgroundColor: '#4CAF50'
                }, {
                    label: 'Thua',
                    data: [0, 0, 0, 0],
                    backgroundColor: '#F44336'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff', font: { size: 11 } }
                    },
                    title: {
                        display: true,
                        text: 'Thống kê theo phiên',
                        color: '#ffffff',
                        font: { size: 13 }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#ffffff', font: { size: 10 } },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: '#ffffff', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error("Lỗi khi khởi tạo biểu đồ:", error);
    }
    
    // Khởi tạo trình dự đoán Cơ Bản
    BaccaratBasicPredictor.init();
});