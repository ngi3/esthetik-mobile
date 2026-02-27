# EsthetikApp - Contributing Guide

Merci de votre intérêt pour contribuer à EsthetikApp ! Voici quelques directives pour vous aider à démarrer.

## 🚀 Processus de Contribution

1. **Fork** le repository
2. **Clone** votre fork localement
3. **Créez une branche** pour votre feature/fix
4. **Commitez** vos changements
5. **Pushez** vers votre fork
6. **Ouvrez une Pull Request**

## 📋 Standards de Code

### TypeScript

- Utiliser TypeScript pour tous les nouveaux fichiers
- Typer explicitement les paramètres et retours de fonction
- Éviter `any` autant que possible
- Utiliser les interfaces pour les objets complexes

### React Native

- Utiliser les hooks React (pas de class components)
- Composants fonctionnels avec TypeScript
- Props typées avec des interfaces
- Utiliser useMemo et useCallback pour optimiser les performances

### Naming Conventions

- **Fichiers**: camelCase pour les utils, PascalCase pour les composants
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Interfaces/Types**: PascalCase avec préfixe `I` optionnel
- **Composants**: PascalCase

### Structure des Fichiers

```typescript
// 1. Imports externes
import React, { useState } from "react";
import { View, Text } from "react-native";

// 2. Imports internes
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";

// 3. Types/Interfaces
interface Props {
  userId: string;
  onUpdate: () => void;
}

// 4. Composant
export default function MyComponent({ userId, onUpdate }: Props) {
  // hooks
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // handlers
  const handleSubmit = async () => {
    // ...
  };

  // render
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}

// 5. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## 🧪 Tests

Avant de soumettre une PR:

- Tester sur iOS ET Android si possible
- Vérifier qu'il n'y a pas d'erreurs TypeScript: `npm run lint`
- Tester les fonctionnalités ajoutées/modifiées
- S'assurer que l'app build correctement

## 📝 Commits

Utilisez des messages de commit clairs et descriptifs:

```
feat: ajouter système de notation des services
fix: corriger l'affichage des notifications sur iOS
refactor: améliorer la structure du auth context
docs: mettre à jour le README avec les instructions de build
style: formater le code selon les standards
```

Préfixes recommandés:

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement de fonctionnalité
- `docs`: Documentation
- `style`: Formatage, point-virgules manquants, etc.
- `test`: Ajout ou modification de tests
- `chore`: Tâches de maintenance

## 🐛 Reporting Bugs

Lorsque vous reportez un bug, incluez:

- Description claire du problème
- Steps pour reproduire
- Comportement attendu vs comportement actuel
- Screenshots si applicable
- Version de l'OS (iOS/Android)
- Logs d'erreur

## 💡 Suggestions de Features

Pour suggérer une nouvelle feature:

- Expliquez le problème que ça résout
- Décrivez la solution proposée
- Listez les alternatives considérées
- Ajoutez des mockups/screenshots si applicable

## 📦 Pull Requests

Votre PR devrait:

- Avoir un titre clair et descriptif
- Référencer l'issue associée (si applicable)
- Inclure une description des changements
- Passer tous les checks (lint, build)
- Avoir des commits atomiques et bien nommés

## ❓ Questions

Si vous avez des questions, n'hésitez pas à:

- Ouvrir une issue avec le label `question`
- Contacter les mainteneurs

Merci de contribuer à EsthetikApp ! 🎉
