function showDetail(title, desc) {
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('featureModal').style.display = 'flex';
        }
        function closeDetail() {
            document.getElementById('featureModal').style.display = 'none';
        }
        document.querySelector('.features-grid').addEventListener('click', (event) => {
            const card = event.target.closest('.feat-card');
            if (card) showDetail(card.dataset.featureTitle, card.dataset.featureDescription);
        });
        document.getElementById('closeFeatureModalBtn').addEventListener('click', closeDetail);

        // Slider
        const slider = document.getElementById('slider');
        let idx = 0;
        setInterval(() => {
            idx = (idx + 1) % 4;
            slider.style.transform = `translateX(-${idx * 100}%)`;
        }, 3000);

        // --- Dynamic Developer Button Color & Text Switcher ---
        const devBtn = document.getElementById('dynamicDevBtn');
        const devBtnText = devBtn.querySelector('span');
        const labels = ["Contact Developer", "Want your own app?"];
        let labelIdx = 0;
        
        setInterval(() => {
            labelIdx = (labelIdx + 1) % labels.length;
            
            // Start Fade out
            devBtnText.style.opacity = 0;
            
            setTimeout(() => {
                // Change Text
                devBtnText.innerText = labels[labelIdx];
                
                // Toggle Color Class
                if(labelIdx === 1) {
                    devBtn.classList.add('alt-style');
                } else {
                    devBtn.classList.remove('alt-style');
                }
                
                // Fade in
                devBtnText.style.opacity = 1;
            }, 300);
        }, 2500);

        // Reveal Animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        // Counting Logic
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = +el.getAttribute('data-target');
                    let current = 0;
                    const increment = target / 50;
                    const update = () => {
                        if (current < target) {
                            current += increment;
                            el.innerText = Math.ceil(current);
                            requestAnimationFrame(update);
                        } else el.innerText = target;
                    };
                    update();
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 1 });
        document.querySelectorAll('.counter').forEach(c => counterObserver.observe(c));
    