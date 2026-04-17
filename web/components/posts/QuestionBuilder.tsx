import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { Button, Input } from '~/components/ui';
import type { PostFormAction } from '~/containers/CreatePostView';
import type { FormQuestion } from '~/data/mock-pg-announcements';

const MAX_QUESTIONS = 5;
const MIN_MCQ_OPTIONS = 2;
const MAX_MCQ_OPTIONS = 6;

interface QuestionBuilderProps {
  questions: FormQuestion[];
  dispatch: React.Dispatch<PostFormAction>;
}

function QuestionBuilder({ questions, dispatch }: QuestionBuilderProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Additional Questions</p>

      {questions.map((question, index) => (
        <div key={question.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder={`Question ${index + 1}`}
                value={question.text}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_QUESTION',
                    id: question.id,
                    payload: { text: e.target.value },
                  })
                }
              />

              <div className="flex items-center gap-2">
                <Button
                  variant={question.type === 'free-text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_QUESTION',
                      id: question.id,
                      payload: { type: 'free-text' },
                    })
                  }
                >
                  Free Text
                </Button>
                <Button
                  variant={question.type === 'mcq' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_QUESTION',
                      id: question.id,
                      payload: {
                        type: 'mcq',
                        options: question.type === 'mcq' ? question.options : ['', ''],
                      },
                    })
                  }
                >
                  MCQ
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === 0}
                onClick={() =>
                  dispatch({
                    type: 'MOVE_QUESTION',
                    id: question.id,
                    direction: 'up',
                  })
                }
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === questions.length - 1}
                onClick={() =>
                  dispatch({
                    type: 'MOVE_QUESTION',
                    id: question.id,
                    direction: 'down',
                  })
                }
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => dispatch({ type: 'REMOVE_QUESTION', id: question.id })}
                aria-label="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {question.type === 'mcq' && (
            <div className="ml-4 space-y-2">
              <p className="text-sm text-muted-foreground">Options</p>
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${optIndex + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[optIndex] = e.target.value;
                      dispatch({
                        type: 'UPDATE_QUESTION',
                        id: question.id,
                        payload: { options: newOptions as [string, ...string[]] },
                      });
                    }}
                    className="flex-1"
                  />
                  {question.options.length > MIN_MCQ_OPTIONS && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        const newOptions = question.options.filter((_, i) => i !== optIndex);
                        dispatch({
                          type: 'UPDATE_QUESTION',
                          id: question.id,
                          payload: {
                            options: newOptions as [string, ...string[]],
                          },
                        });
                      }}
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {question.options.length < MAX_MCQ_OPTIONS && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    dispatch({
                      type: 'UPDATE_QUESTION',
                      id: question.id,
                      payload: {
                        options: [...question.options, ''] as [string, ...string[]],
                      },
                    });
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </Button>
              )}
            </div>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={questions.length >= MAX_QUESTIONS}
        onClick={() => dispatch({ type: 'ADD_QUESTION' })}
      >
        <Plus className="h-4 w-4" />
        Add question
        {questions.length >= MAX_QUESTIONS && (
          <span className="ml-1 text-sm text-muted-foreground">(max {MAX_QUESTIONS})</span>
        )}
      </Button>
    </div>
  );
}

export { QuestionBuilder };
export type { QuestionBuilderProps };
