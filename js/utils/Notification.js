export class Notification {
    constructor(title, message, type = 'success') {
        this.create(title, message, type);
    }

    create(title, message, type) {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        let icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';

        notification.innerHTML = `
            <i class="fas fa-${icon} notification-icon"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <i class="fas fa-times notification-close"></i>
        `;

        notifications.appendChild(notification);

        // Auto-remove após 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Fechar ao clicar no X
        notification.querySelector('.notification-close').onclick = () => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        };
    }
} 