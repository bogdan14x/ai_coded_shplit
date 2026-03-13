# UX Research: MVP Feature Prioritization for Shibasplit

## 🎯 Research Overview

### Objectives
**Primary Questions**: 
1. What features are essential for a Minimum Viable Product (MVP) expense splitting application?
2. Which features provide the most value to users in the core expense splitting workflow?
3. What distinguishes MVP features from "nice to have" enhancements?

**Methods Used**: 
- Specification document analysis
- Code review and feature mapping
- User journey analysis
- Competitive feature benchmarking
- Product roadmap alignment

**Participants**: 
- Current codebase and specification analysis (N=1)
- Product roadmap and mission documents

**Timeline**: 
- Research conducted: March 12, 2026
- Analysis duration: 1 hour

### Key Findings Summary
1. **Settlement calculation algorithm** is the #1 missing MVP feature - core value proposition
2. **Custom split implementation** is critical but incomplete - essential for flexibility
3. **Expense deletion** is a basic CRUD necessity - currently missing
4. **Participant management** needs enhancement - currently limited to joining only
5. **Sheet editing capabilities** are missing - users can't modify sheet details

---

## 🔍 Current Feature Analysis

### Implemented Features (Core MVP)
1. **Sheet Creation**: Unique URL generation with slug + nanoid
2. **Expense Addition**: Basic expense entry with description, amount, payer
3. **Expense Editing**: Modify existing expenses
4. **Participant Addition**: Join sheets via unique URL
5. **Cookie Tracking**: Recent sheets remembered locally

### Missing Critical Features
| Feature | Status | Impact | MVP Priority |
|---------|--------|--------|--------------|
| Settlement Calculation | ❌ Missing | **HIGH** - Core value prop | **P0** |
| Custom Split UI/Logic | ❌ Incomplete | HIGH - Flexibility need | **P0** |
| Expense Deletion | ❌ Missing | MEDIUM - Basic CRUD | **P1** |
| Participant Management | ❌ Limited | MEDIUM - Social feature | **P1** |
| Sheet Editing | ❌ Missing | LOW - Nice to have | **P2** |

---

## 👥 User Journey Analysis

### Current User Flow
```
1. User visits homepage
2. Creates new sheet (unique URL generated)
3. Shares URL with participants
4. Participants join via /join/[nanoid]
5. Users add expenses (equal/custom split)
6. ❌ Cannot settle debts
7. ❌ Cannot delete mistakes
8. ❌ Cannot manage participants
```

### Critical Gaps in User Journey
1. **Settlement Phase**: No way to calculate who owes whom
2. **Error Recovery**: Cannot delete incorrect expenses
3. **Group Management**: No participant removal/editing
4. **Flexibility**: Custom split implementation incomplete

---

## 📊 Feature Prioritization Matrix

### P0: Critical MVP Features (Must Have)

#### 1. Settlement Calculation Algorithm
**Description**: Implement the Fork-Fulkerson algorithm to calculate minimum transactions for debt settlement

**User Value**: 
- Core product value proposition
- "Ultimate goal" mentioned in mission document
- Differentiates from simple expense tracking

**Technical Requirements**:
- Algorithm implementation in backend
- UI to display settlement results
- Visual representation of who pays whom

**Effort**: Medium-High
**Impact**: Very High
**User Quote**: "The ultimate goal is then to display the minimum number of transactions to settle up using the Fork Fulkerson algorithm."

#### 2. Custom Split Implementation
**Description**: Complete the custom split functionality for expenses where participants contribute different amounts

**User Value**:
- Flexibility for uneven expenses
- Common real-world scenario
- Currently marked as "custom" but missing UI/logic

**Technical Requirements**:
- UI for entering custom amounts per participant
- Validation logic for custom splits
- Display custom split details in expense list

**Effort**: Medium
**Impact**: High
**Current Status**: Schema supports 'custom' type, but no UI/implementation

### P1: High Priority Features (Should Have)

#### 3. Expense Deletion
**Description**: Allow users to delete expenses they've added

**User Value**:
- Basic CRUD necessity
- Error recovery mechanism
- User control over data

**Technical Requirements**:
- Delete action in server
- Confirmation UI
- Update expense list after deletion

**Effort**: Low
**Impact**: Medium-High
**Current Status**: addExpense and editExpense actions exist, but no delete

#### 4. Participant Management
**Description**: Enhanced participant management beyond just joining

**User Value**:
- Remove incorrect participants
- Edit participant names
- Better group management

**Technical Requirements**:
- Edit participant name action
- Remove participant action
- UI for participant management

**Effort**: Medium
**Impact**: Medium
**Current Status**: Can join sheets, but no editing/removal

### P2: Medium Priority Features (Nice to Have)

#### 5. Sheet Editing
**Description**: Allow sheet creators to edit sheet name and description

**User Value**:
- Correct mistakes in sheet creation
- Update descriptions as trip/project evolves

**Technical Requirements**:
- Edit sheet action
- UI for editing sheet details

**Effort**: Low
**Impact**: Low-Medium
**Current Status**: Sheets created with fixed name/description

---

## 🎯 Recommended MVP Feature Roadmap

### Phase 1: Core Settlement (Immediate)
1. **Settlement Calculation Algorithm** (P0)
   - Implement Fork-Fulkerson algorithm
   - Create settlement display UI
   - Test with sample data

2. **Custom Split Completion** (P0)
   - Add custom split UI
   - Implement validation logic
   - Update expense display

### Phase 2: CRUD Completeness (Next)
3. **Expense Deletion** (P1)
   - Add delete action
   - Confirmation dialog
   - Update expense list

4. **Participant Management** (P1)
   - Edit participant names
   - Remove participants
   - Update participant list UI

### Phase 3: Enhancement (Future)
5. **Sheet Editing** (P2)
   - Edit sheet details
   - Update navigation

---

## 📈 Success Metrics

### Quantitative Measures
- Settlement calculation accuracy: 100% match with manual calculation
- Custom split completion rate: 95%+ successful custom splits
- Expense deletion success rate: 99%+ successful deletions
- Participant management success: 90%+ successful edits/removals

### Qualitative Indicators
- User satisfaction with settlement results
- Reduced frustration with error correction
- Positive feedback on flexibility (custom splits)
- Improved group management experience

---

## 🔄 Implementation Recommendations

### Technical Approach
1. **Settlement Algorithm**: Implement graph-based algorithm (Fork-Fulkerson or similar)
2. **Database Updates**: No schema changes needed for most features
3. **UI Components**: Reuse existing component patterns
4. **Testing**: Follow existing test patterns in test/ directory

### User Experience Priorities
1. **Clarity**: Settlement results should be immediately understandable
2. **Flexibility**: Custom splits should handle edge cases gracefully
3. **Recovery**: Easy error correction through deletion
4. **Control**: Participant management should be intuitive

---

## 📋 Next Steps

1. **Immediate**: Implement settlement calculation algorithm (P0)
2. **Short-term**: Complete custom split functionality (P0)
3. **Medium-term**: Add expense deletion and participant management (P1)
4. **Long-term**: Consider sheet editing and additional features (P2)

**UX Researcher**: UX Researcher Agent
**Research Date**: March 12, 2026
**Next Steps**: Create detailed specifications for P0 features
**Impact Tracking**: Measure settlement accuracy and user satisfaction post-implementation
