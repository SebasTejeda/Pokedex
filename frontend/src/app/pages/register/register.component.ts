// src/app/pages/register/register.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // ==========================================
  // 📊 SIGNALS
  // ==========================================

  isLoading = signal(false);
  errorMessage = signal<string>('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // ==========================================
  // 📝 FORMULARIO
  // ==========================================

  registerForm: FormGroup = this.fb.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(6), this.passwordStrengthValidator],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  // ==========================================
  // 🎯 MÉTODOS
  // ==========================================

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, email, password } = this.registerForm.value;

    this.authService.register({ username, email, password }).subscribe({
      next: (response) => {
        this.router.navigate(['/team']);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Manejar diferentes tipos de errores
        if (error.status === 400) {
          const detail = error.error?.detail || '';
          if (detail.includes('email')) {
            this.errorMessage.set('El email ya está registrado');
          } else if (detail.includes('username')) {
            this.errorMessage.set('El nombre de usuario ya está en uso');
          } else {
            this.errorMessage.set(detail || 'Datos inválidos');
          }
        } else if (error.status === 0) {
          this.errorMessage.set('No se pudo conectar con el servidor');
        } else {
          this.errorMessage.set('Ocurrió un error. Intenta nuevamente.');
        }
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  // ==========================================
  // ✅ VALIDADORES PERSONALIZADOS
  // ==========================================

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasLetter = /[a-zA-Z]/.test(value);

    const passwordValid = hasNumber && hasLetter;

    return !passwordValid ? { passwordStrength: true } : null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // ==========================================
  // 🛠️ MÉTODOS AUXILIARES
  // ==========================================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    if (field.errors['pattern']) {
      return 'Solo letras, números y guión bajo';
    }
    if (field.errors['passwordStrength']) {
      return 'Debe contener letras y números';
    }

    return '';
  }

  getPasswordMatchError(): string {
    const form = this.registerForm;
    const confirmField = form.get('confirmPassword');

    if (form.errors && form.errors['passwordMismatch'] && confirmField?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Computed para mostrar fortaleza de contraseña
  getPasswordStrength(): 'weak' | 'medium' | 'strong' | null {
    const password = this.registerForm.get('password')?.value;
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'weak';
    if (strength === 2) return 'medium';
    return 'strong';
  }
}
