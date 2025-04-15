export class Notification {
    constructor(options) {
        if (typeof options === 'string') {
            // Compatibilidade com versão anterior
            const title = arguments[0];
            const message = arguments[1];
            const type = arguments[2] || 'success';
            this.create(title, message, type);
        } else {
            // Novo formato usando objeto de configuração
            const { 
                title = 'Notificação', 
                message, 
                type = 'success', 
                duration = 5000 
            } = options;
            
            this.create(title, message, type, duration);
        }
    }

    create(title, message, type, duration = 5000) {
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

        // Auto-remove após o tempo especificado
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Fechar ao clicar no X
        notification.querySelector('.notification-close').onclick = () => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        };
    }
    
    show() {
        // Método para permitir chamada em cadeia
        return this;
    }
} 