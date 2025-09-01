'use client'

import { useEffect } from 'react'

export default function SimpleConfetti() {
  useEffect(() => {
    const createConfetti = () => {
      const colors = [
        '#FFD700', // Dorado brillante
        '#FFA500', // Naranja dorado
        '#DAA520', // Dorado oscuro
        '#B8860B', // Dorado oliva
        '#C0C0C0', // Plateado
        '#E5E4E2', // Plateado claro
        '#A8A8A8', // Plateado medio
        '#808080', // Gris plateado
        '#F5DEB3', // Trigo dorado
        '#D2B48C'  // Bronce claro
      ]
      
      for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div')
        const color = colors[Math.floor(Math.random() * colors.length)]
        const shape = Math.floor(Math.random() * 4) // 0: círculo, 1: cuadrado, 2: rectángulo, 3: triángulo
        const size = Math.random() * 8 + 4 // Tamaño entre 4px y 12px
        
        // Calcular posición inicial en el centro inferior
        const startX = 50 + (Math.random() - 0.5) * 20 // Centro ± 10%
        
        // Calcular dirección del cono (ángulo aleatorio dentro del cono)
        const angle = (Math.random() - 0.5) * 40 - 90 // Cono de 40° centrado hacia arriba (-90°)
        const distance = Math.random() * 400 + 300 // Distancia variable (más alta)
        const endX = Math.cos(angle * Math.PI / 180) * distance * 0.01
        const endY = -Math.sin(angle * Math.PI / 180) * distance * 0.01
        
        confetti.style.position = 'fixed'
        confetti.style.left = startX + 'vw'
        confetti.style.bottom = '0px' // Empezar desde abajo
        confetti.style.backgroundColor = color
        confetti.style.pointerEvents = 'none'
        confetti.style.zIndex = '9999'
        
        // Diferentes formas de confeti
        switch (shape) {
          case 0: // Círculo
            confetti.style.width = size + 'px'
            confetti.style.height = size + 'px'
            confetti.style.borderRadius = '50%'
            break
          case 1: // Cuadrado
            confetti.style.width = size + 'px'
            confetti.style.height = size + 'px'
            confetti.style.borderRadius = '2px'
            break
          case 2: // Rectángulo
            confetti.style.width = (size * 1.5) + 'px'
            confetti.style.height = (size * 0.7) + 'px'
            confetti.style.borderRadius = '1px'
            break
          case 3: // Triángulo
            confetti.style.width = '0'
            confetti.style.height = '0'
            confetti.style.borderLeft = (size/2) + 'px solid transparent'
            confetti.style.borderRight = (size/2) + 'px solid transparent'
            confetti.style.borderBottom = size + 'px solid ' + color
            confetti.style.backgroundColor = 'transparent'
            break
        }
        
        // Rotación aleatoria
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`
        
        // Crear animación personalizada para cada confeti
        const animationName = `explode-${i}`
        const style = document.createElement('style')
        style.textContent = `
          @keyframes ${animationName} {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg) scale(0);
              opacity: 1;
            }
            20% {
              transform: translateY(-${Math.random() * 200 + 100}px) translateX(${endX * 20}vw) rotate(${Math.random() * 180}deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-${Math.random() * 600 + 400}px) translateX(${endX * 40}vw) rotate(${Math.random() * 720}deg) scale(0.8);
              opacity: 0;
            }
          }
        `
        document.head.appendChild(style)
        
        confetti.style.animation = `${animationName} ${Math.random() * 1.5 + 1.5}s ease-out forwards`
        
        document.body.appendChild(confetti)
        
        // Remover después de la animación
        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti)
          }
          if (style.parentNode) {
            style.parentNode.removeChild(style)
          }
        }, 5000)
      }
    }

    createConfetti()
  }, [])

  return null
}
