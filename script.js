function toggleMenu(element) {
    const menu = element.querySelector('.menu');
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
}